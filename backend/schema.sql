CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TYPE rol_usuario AS ENUM (
  'escaner',
  'supervisor',
  'auditor',
  'admin'
);

CREATE TYPE estado_bien AS ENUM (
  'activo',
  'baja',
  'extraviado',
  'en_proceso_baja'
);

CREATE TYPE estado_sesion AS ENUM (
  'abierta',
  'pausada',
  'cerrada'
);

CREATE TYPE resultado_escaneo AS ENUM (
  'coincide',
  'encontrado',
  'no_en_catalogo'
);

CREATE TABLE dependencias (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clave_dependencia VARCHAR(20) NOT NULL UNIQUE,
  nombre            TEXT        NOT NULL,
  responsable       TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dependencia_id   UUID        NOT NULL REFERENCES dependencias(id),
  nombre_completo  TEXT        NOT NULL,
  usuario          VARCHAR(60) NOT NULL,
  password_hash    TEXT        NOT NULL,
  rol              rol_usuario NOT NULL,
  activo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_usuario_por_dependencia UNIQUE (dependencia_id, usuario)
);

CREATE INDEX idx_usuarios_dependencia ON usuarios(dependencia_id);
CREATE INDEX idx_usuarios_activo      ON usuarios(activo) WHERE activo = TRUE;

CREATE TABLE versiones_catalogo (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  dependencia_id UUID        NOT NULL REFERENCES dependencias(id),
  numero_version INTEGER     NOT NULL,
  activa         BOOLEAN     NOT NULL DEFAULT TRUE,
  importado_por  UUID        NOT NULL REFERENCES usuarios(id),
  total_bienes   INTEGER     NOT NULL DEFAULT 0,
  hash_archivo   TEXT        NOT NULL,
  nombre_archivo TEXT        NOT NULL,
  importado_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_version_por_dependencia UNIQUE (dependencia_id, numero_version)
);

CREATE UNIQUE INDEX idx_una_version_activa
  ON versiones_catalogo(dependencia_id)
  WHERE activa = TRUE;

CREATE TABLE catalogo_bienes (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id         UUID        NOT NULL REFERENCES versiones_catalogo(id),
  dependencia_id     UUID        NOT NULL REFERENCES dependencias(id),
  numero_inventario  VARCHAR(80) NOT NULL,
  numero_serie       VARCHAR(100),
  descripcion        TEXT        NOT NULL,
  marca              VARCHAR(80),
  modelo             VARCHAR(80),
  ubicacion_esperada TEXT,
  resguardo          VARCHAR(100),
  clasificacion      VARCHAR(60),
  estado             estado_bien NOT NULL DEFAULT 'activo',
  metadatos          JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_numero_inv_por_version UNIQUE (version_id, numero_inventario)
);

CREATE INDEX idx_bienes_version       ON catalogo_bienes(version_id);
CREATE INDEX idx_bienes_dependencia   ON catalogo_bienes(dependencia_id);
CREATE INDEX idx_bienes_numero_inv    ON catalogo_bienes(numero_inventario);
CREATE INDEX idx_bienes_estado        ON catalogo_bienes(estado);
CREATE INDEX idx_bienes_resguardo     ON catalogo_bienes(resguardo);

CREATE RULE no_update_catalogo AS ON UPDATE TO catalogo_bienes DO INSTEAD NOTHING;
CREATE RULE no_delete_catalogo AS ON DELETE TO catalogo_bienes DO INSTEAD NOTHING;

CREATE TABLE sesiones_escaneo (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  dependencia_id  UUID          NOT NULL REFERENCES dependencias(id),
  version_id      UUID          NOT NULL REFERENCES versiones_catalogo(id),
  iniciado_por    UUID          NOT NULL REFERENCES usuarios(id),
  cerrado_por     UUID          REFERENCES usuarios(id),
  nombre_sesion   TEXT          NOT NULL,
  descripcion     TEXT,
  area_cubierta   TEXT,
  estado          estado_sesion NOT NULL DEFAULT 'abierta',
  hash_cierre     TEXT,
  iniciada_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  cerrada_at      TIMESTAMPTZ,
  CONSTRAINT ck_cerrada_tiene_hash    CHECK (estado != 'cerrada' OR hash_cierre IS NOT NULL),
  CONSTRAINT ck_cerrada_tiene_usuario CHECK (estado != 'cerrada' OR cerrado_por IS NOT NULL),
  CONSTRAINT ck_cerrada_tiene_fecha   CHECK (estado != 'cerrada' OR cerrada_at IS NOT NULL)
);

CREATE OR REPLACE FUNCTION fn_proteger_sesion_cerrada()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.estado = 'cerrada' THEN
    RAISE EXCEPTION 'Una sesión cerrada no puede modificarse (id: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_proteger_sesion_cerrada
  BEFORE UPDATE ON sesiones_escaneo
  FOR EACH ROW EXECUTE FUNCTION fn_proteger_sesion_cerrada();

CREATE INDEX idx_sesiones_dependencia ON sesiones_escaneo(dependencia_id);
CREATE INDEX idx_sesiones_estado      ON sesiones_escaneo(estado);
CREATE INDEX idx_sesiones_iniciada    ON sesiones_escaneo(iniciada_at DESC);

CREATE TABLE escaneos (
  id                  UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id           UUID              NOT NULL REFERENCES sesiones_escaneo(id),
  bien_id             UUID              REFERENCES catalogo_bienes(id),
  escaneado_por       UUID              NOT NULL REFERENCES usuarios(id),
  resultado           resultado_escaneo NOT NULL,
  numero_inv_leido    VARCHAR(80)       NOT NULL,
  ubicacion_escaneada TEXT,
  observaciones       TEXT,
  escaneado_at        TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION fn_validar_sesion_abierta()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_estado estado_sesion;
BEGIN
  SELECT estado INTO v_estado FROM sesiones_escaneo WHERE id = NEW.sesion_id;
  IF v_estado != 'abierta' THEN
    RAISE EXCEPTION 'No se puede escanear en una sesión % (id: %)', v_estado, NEW.sesion_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_sesion_abierta
  BEFORE INSERT ON escaneos
  FOR EACH ROW EXECUTE FUNCTION fn_validar_sesion_abierta();

CREATE RULE no_update_escaneos AS ON UPDATE TO escaneos DO INSTEAD NOTHING;
CREATE RULE no_delete_escaneos AS ON DELETE TO escaneos DO INSTEAD NOTHING;

CREATE INDEX idx_escaneos_sesion     ON escaneos(sesion_id);
CREATE INDEX idx_escaneos_bien       ON escaneos(bien_id);
CREATE INDEX idx_escaneos_resultado  ON escaneos(resultado);
CREATE INDEX idx_escaneos_at         ON escaneos(escaneado_at DESC);
CREATE INDEX idx_escaneos_numero_inv ON escaneos(numero_inv_leido);

CREATE TABLE audit_log (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID        REFERENCES usuarios(id),
  sesion_id        UUID        REFERENCES sesiones_escaneo(id),
  tabla_afectada   TEXT        NOT NULL,
  operacion        TEXT        NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos     JSONB,
  ip_origen        INET,
  user_agent       TEXT,
  registrado_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE RULE no_update_audit AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_log DO INSTEAD NOTHING;

CREATE INDEX idx_audit_usuario    ON audit_log(usuario_id);
CREATE INDEX idx_audit_sesion     ON audit_log(sesion_id);
CREATE INDEX idx_audit_operacion  ON audit_log(operacion);
CREATE INDEX idx_audit_registrado ON audit_log(registrado_at DESC);

CREATE VIEW v_resumen_sesion AS
SELECT
  s.id                                        AS sesion_id,
  s.dependencia_id,
  s.nombre_sesion,
  s.estado,
  s.iniciada_at,
  s.cerrada_at,
  u_ini.nombre_completo                       AS iniciado_por,
  u_cie.nombre_completo                       AS cerrado_por,
  v.numero_version                            AS version_catalogo,
  COUNT(DISTINCT cb.id)                       AS total_en_catalogo,
  COUNT(DISTINCT e.bien_id)
    FILTER (WHERE e.resultado IN ('coincide','encontrado'))
                                              AS total_escaneados,
  COUNT(DISTINCT e.id)
    FILTER (WHERE e.resultado = 'coincide')   AS coincidencias,
  COUNT(DISTINCT e.id)
    FILTER (WHERE e.resultado = 'encontrado') AS ubicacion_diferente,
  COUNT(DISTINCT e.id)
    FILTER (WHERE e.resultado = 'no_en_catalogo')
                                              AS no_en_catalogo,
  COUNT(DISTINCT cb.id) -
    COUNT(DISTINCT e.bien_id)
    FILTER (WHERE e.resultado IN ('coincide','encontrado'))
                                              AS faltantes
FROM sesiones_escaneo s
JOIN versiones_catalogo v    ON v.id = s.version_id
JOIN catalogo_bienes cb      ON cb.version_id = v.id AND cb.estado = 'activo'
JOIN usuarios u_ini          ON u_ini.id = s.iniciado_por
LEFT JOIN usuarios u_cie     ON u_cie.id = s.cerrado_por
LEFT JOIN escaneos e         ON e.sesion_id = s.id
GROUP BY s.id, s.dependencia_id, s.nombre_sesion, s.estado,
         s.iniciada_at, s.cerrada_at,
         u_ini.nombre_completo, u_cie.nombre_completo, v.numero_version;

CREATE VIEW v_faltantes_por_sesion AS
SELECT
  s.id               AS sesion_id,
  s.nombre_sesion,
  cb.numero_inventario,
  cb.numero_serie,
  cb.descripcion,
  cb.marca,
  cb.modelo,
  cb.ubicacion_esperada,
  cb.resguardo,
  cb.clasificacion
FROM sesiones_escaneo s
JOIN versiones_catalogo v ON v.id = s.version_id
JOIN catalogo_bienes cb   ON cb.version_id = v.id AND cb.estado = 'activo'
WHERE NOT EXISTS (
  SELECT 1 FROM escaneos e
  WHERE e.sesion_id = s.id
    AND e.bien_id = cb.id
    AND e.resultado IN ('coincide', 'encontrado')
);

CREATE TABLE co_usuarios (
  id       SERIAL PRIMARY KEY,
  usuario  VARCHAR(60) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE co_oficialias (
  id        SERIAL PRIMARY KEY,
  numero    VARCHAR(20) DEFAULT '',
  nombre    TEXT NOT NULL,
  region    VARCHAR(60) DEFAULT '',
  sistema   VARCHAR(20) DEFAULT '',
  listo_sid BOOLEAN DEFAULT false
);

CREATE TABLE co_oficiales (
  id         SERIAL PRIMARY KEY,
  nombres    TEXT NOT NULL,
  ap1        TEXT NOT NULL,
  ap2        TEXT DEFAULT '',
  username   TEXT DEFAULT '',
  tel        TEXT DEFAULT '',
  email      TEXT DEFAULT '',
  perfil     TEXT DEFAULT '',
  municipio  TEXT DEFAULT '',
  oficialia  INTEGER DEFAULT 0,
  region     TEXT DEFAULT '',
  sistema    TEXT DEFAULT '',
  sid        BOOLEAN DEFAULT false,
  internet   BOOLEAN DEFAULT false,
  starlink   BOOLEAN DEFAULT false,
  activo     BOOLEAN DEFAULT true,
  pendiente  BOOLEAN DEFAULT false,
  obs        TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_co_oficiales_oficialia ON co_oficiales(oficialia);
CREATE INDEX idx_co_oficiales_sid       ON co_oficiales(sid);
CREATE INDEX idx_co_oficiales_activo    ON co_oficiales(activo);
CREATE INDEX idx_co_oficiales_pendiente ON co_oficiales(pendiente);

INSERT INTO dependencias (clave_dependencia, nombre, responsable)
VALUES ('SADEO', 'Secretaría de Administración del Estado de Oaxaca', 'Administrador');

INSERT INTO usuarios (dependencia_id, nombre_completo, usuario, password_hash, rol)
VALUES (
  (SELECT id FROM dependencias WHERE clave_dependencia = 'SADEO'),
  'Administrador del Sistema',
  'admin',
  '$2a$12$TU8yUBbRPmpBMAG3Nvz6O.aM.rSGt19GgnppjEDnNA0XV9ADNwd6u',
  'admin'
);

INSERT INTO co_usuarios (usuario, password) VALUES ('admin', 'admin123');

INSERT INTO co_oficialias (numero, nombre, region, sistema, listo_sid) VALUES
('66','PUTLA VILLA DE GUERERO','SIERRA SUR','SIRCO',true),
('118','SAN JUAN BAUTISTA VALLE NACIONAL','PAPALOAPAM','SID',true),
('56','SANTIAGO ZACATEPEC MIXES','SIERRA NORTE','SIRCO',true),
('3','TERCERA OFICIALIA DEL CENTRO','VALLES CENTRALES','SID',true),
('39','HUAUTLA DE JIMENEZ','CAÑADA','SID',true),
('61','SAN FRANCISCO CAJONOS','SIERRA NORTE','SIRCO',true),
('12','ZIMATLÁN DE ALVAREZ','VALLES CENTRALES','SID',true),
('','10 ITINERANTE','VALLES CENTRALES','SID',true),
('63','SEGUNDA OFICIALÍA DE MIAHUATLÁN DE PORFIRIO DÍAZ','SIERRA SUR','SID',true),
('4','CUARTA OFICIALIA','VALLES CENTRALES','SID',false),
('101','101 DONAJI','ITSMO','SID',true),
('156','VILLA HIDALGO YALALAG','SIERRA NORTE','SIRCO',true),
('12','MÓDULO HOSPITALARIO HUAJUAPAN','MIXTECA','SIRCO',false),
('55','IXTLÁN DE JUÁREZ','SIERRA NORTE','SID',true),
('126','SAN ANDRÉS CHICAHUAXTLA','SIERRA SUR','SIRCO',true),
('40','SANTA MARÍA CHILCHOTLA','CAÑADA','SID',true),
('60','VILLA TALEA DE CASTRO','SIERRA NORTE','SIRCO',true),
('96','SANTA MARÍA COLOTEPEC','COSTA','SID',true),
('124','SANTA MARIA JALAPA DEL MARQUÉS','ITSMO','SID',true),
('123','SANTO DOMINGO TEOJOMULCO','SIERRA SUR','SIRCO',true),
('110','SANTA CATARINA LOXICHA','COSTA','SIRCO',true),
('20','SAN LORENZO LALANA','SIERRA NORTE','SIRCO',true),
('','TLACOLULA DE MATAMOROS','VALLES CENTRALES','SID',true),
('93','SANTO TOMAS OCOTEPEC','MIXTECA','SID',true),
('32','SANTA CATARINA JUQUILA','COSTA','SID',true),
('','MODULO HOSPITALARIO IMSS-BIENESTAR TLACOLULA DE MATAMOROS','VALLES CENTRALES','SIRCO',false),
('120','SEGUNDA OFICIALIA DE SALINA CRUZ','ITSMO','SID',true),
('25','OFICIALIA DE SANTO DOMINGO TEHUANTEPEC','ITSMO','SID',true),
('12','MÓDULO HOSPITAL IMSS-BIENESTAR 34 TLAXIACO','MIXTECA','SIRCO',false),
('70','SANTA MARÍA ECATEPEC','SIERRA SUR','SIRCO',true),
('105','MAGDALENA TEQUISISTLAN','ITSMO','SID',true),
('68','SANTA CRUZ ITUNDIJIA','SIERRA SUR','SID',true),
('146','SAN JOSÉ CHILTEPEC','PAPALOAPAM','SID',true),
('14','SAN FELIPE JALAPA DE DÍAZ','PAPALOAPAM','SIRCO',true),
('92','92 SAN FELIPE USILA','PAPALOAPAM','SID',true),
('27','SAN JUAN GUICHICOVI','ITSMO','SID',true),
('12','MODULO HOSPITALARIO MIAHUATLÁN DE PORFIRIO DÍAZ','SIERRA SUR','SID',false),
('','DECIMA OFICIALIA DE SAN BARTOLO COYOTEPEC','VALLES CENTRALES','SID',true),
('2','SEGUNDA OFICIALÍA DEL CENTRO','VALLES CENTRALES','SID',true),
('122','SAN GABRIEL MIXTEPEC','COSTA','SIRCO',true),
('102','SAN ANDRES CABECERA NUEVA','SIERRA SUR','SIRCO',true),
('104','SAN PEDRO HUAMELULA','ITSMO','SIRCO',true),
('9','SAN PABLO VILLA DE MITLA','VALLES CENTRALES','SID',true),
('79','UNIÓN HIDALGO','ITSMO','SID',true),
('158','SAN SIMÓN ZAHUATLAN PRIMERA OFICIALÍA','MIXTECA','SIRCO',false),
('62','PRIMERA OFICIALIA DE MIAHUATLÁN','SIERRA SUR','SID',true),
('72','LA LUZ LLANO DE NOPAL','MIXTECA','SIRCO',false),
('109','SANTA CRUZ XOXOCOTLAN','VALLES CENTRALES','SID',true),
('115','SAN PABLO GÜILÁ','VALLES CENTRALES','SID',true),
('73','VILLA DE TUTUTEPEC','COSTA','SID',true),
('155','SANTO DOMINGO TEPUXTEPEC','SIERRA NORTE','SID',true),
('64','SANTA MARÍA OZOLOTEPEC','SIERRA SUR','SIRCO',true),
('36','FERMÍN RAMÍREZ GARCÍA','COSTA','SID',true),
('88','QUINTA OFICIALIA DEL CENTRO','VALLES CENTRALES','SID',true),
('130','CANDELARIA LOXICHA','COSTA','SID',true),
('50','SANTIAGO JUXTLAHUACA','MIXTECA','SID',true),
('98','SAN JERÓNIMO TECOATL','CAÑADA','SIRCO',true),
('142','SAN JUAN OZOLOTEPEC','SIERRA SUR','SIRCO',true),
('125','SANTO DOMINGO PETAPA','ITSMO','SID',true),
('46','SAN PEDRO Y SAN PABLO TEPOSCOLULA','MIXTECA','SID',true),
('12','ASUNCIÓN IXTALTEPEC.JUCHITAN OAXACA','ITSMO','SIRCO',false),
('29','SANTIAGO JAMILTEPEC','COSTA','SID',true),
('65','VILLA SOLA DE VEGA','SIERRA SUR','SIRCO',true),
('135','SANTIAGO AMOLTEPEC','SIERRA SUR','SIRCO',false),
('26','MATIAS ROMERO AVENDAÑO','ITSMO','SID',true),
('41','PRIMERA OFICIALÍA DE HUAJUAPAN DE LEÓN','MIXTECA','SID',true),
('84','SANTO DOMINGO TONALÁ','MIXTECA','SIRCO',false),
('144','SAN JUAN CACAHUATEPEC','COSTA','SID',true),
('67','SANTA MARIA ZACATEPEC.','SIERRA SUR','SIRCO',true),
('59','SAN ILDEFONSO VILLA ALTA','SIERRA NORTE','SIRCO',true),
('100','EL ESPINAL','ITSMO','SID',true),
('38','TEOTITLAN DE FLORES MAGÓN','MIXTECA','SID',true),
('153','PRIMERA OFICIALIA DEL REGISTRO CIVIL','SIERRA NORTE','SID',true),
('152','SAN ANTONINO MONTE VERDE','MIXTECA','SIRCO',true),
('6','VILLA DE ETLA','VALLES CENTRALES','SID',true),
('53','SAN JUAN MIXTEPEC','MIXTECA','SIRCO',true),
('92','SAN FELIPE USILA','PAPALOAPAM','SID',true),
('154','1 OFICIALÍA AYOTZINTEPEC','PAPALOAPAM','SID',true),
('37','SAN JUAN BAUTISTA CUICATLAN, CUICATLAN. OAXACA','CAÑADA','SIRCO',true),
('23','SANTO DOMINGO ZANATEPEC','ITSMO','SID',true),
('157','SAN PEDRO QUIATONI','VALLES CENTRALES','SID',true),
('18','COSOLAPA OAXACA','PAPALOAPAM','SID',true),
('','1A. OFICIALIA JUCHITAN DE ZARA','ITSMO','SID',true),
('54','SILACAYOÁPAM','MIXTECA','SIRCO',true),
('11','VILLA DE ZAACHILA','VALLES CENTRALES','SID',true),
('76','SAN MIGUEL QUETZALTEPEC','SIERRA NORTE','SIRCO',true),
('81','SAN MIGUEL CHIMALAPA','ITSMO','SIRCO',true),
('57','SAN PEDRO Y SAN PABLO AYUTLA MIXE','SIERRA NORTE','SID',true),
('77','SAN JOSÉ ESTANCIA GRANDE','COSTA','SID',true),
('45','ASUNCION NOCHIXTLAN','MIXTECA','SID',true),
('145','SAN LORENZO TEXMELUCAN','SIERRA SUR','SIRCO',true),
('127','SANTIAGO LLANO GRANDE','COSTA','SIRCO',true),
('85','SANTIAGO NUYOO','MIXTECA','SIRCO',true),
('5','HEROICA EJUTLA DE CRESPO','VALLES CENTRALES','SID',false),
('97','SAN JUAN COTZOCON','SIERRA NORTE','SIRCO',true),
('24','SAN PEDRO TAPANATEPEC','ITSMO','SID',true),
('75','SAN PEDRO JICAYÁN','COSTA','SIRCO',true),
('134','LA MIXTEQUITA','SIERRA NORTE','SIRCO',true),
('31','031 PINOTEPA DE DON LUIS','COSTA','SID',true),
('129','SANTA MARÍA PEÑOLES','VALLES CENTRALES','SIRCO',true),
('33','PUERTO ESCONDIDO','COSTA','SID',true),
('49','HEROICA CIUDAD DE TLAXIACO','MIXTECA','SID',true),
('139','SANTA LUCIA MONTEVERDE','SIERRA SUR','SID',true),
('83','TEZOATLAN DE SEGURA Y LUNA','MIXTECA','SID',true),
('133','LA LAGUNA GUADALUPE','SIERRA SUR','SIRCO',false),
('108','OFICIALÍA DE SAN FRANCISCO TELIXTLAHUACA','VALLES CENTRALES','SID',true),
('10','SANTIAGO MATATLÁN','VALLES CENTRALES','SID',true),
('','SANTA MARÍA TLALIXTAC.','CAÑADA','SIRCO',false),
('22','CD. IXTEPEC','ITSMO','SID',true),
('44','017 LOMA BONITA OAXACA','PAPALOAPAM','SID',true),
('136','ESTACIÓN SARABIA','ITSMO','SID',true),
('114','SAN PABLO HUITZO','VALLES CENTRALES','SID',true),
('30','SANTIAGO PINOTEPA NACIONAL','COSTA','SID',true),
('44','REGISTRO CIVIL DE SAN MIGUEL EL GRANDE','MIXTECA','SIRCO',true),
('43','MARISCALA DE JUÁREZ','MIXTECA','SID',true),
('74','OFICIALIA DE SANTIAGO YOSONDUA','MIXTECA','SIRCO',true),
('117','TOTONTEPEC VILLA DE MORELOS','SIERRA NORTE','SIRCO',true),
('138','SAN MATEO YUCUTINDOO','SIERRA SUR','SIRCO',true),
('','OFICIALÍA 12 TURNO VESPERTINO','VALLES CENTRALES','SID',true),
('13','PRIMERA OFICIALIA DE SAN JUAN BAUTISTA TUXTEPEC','PAPALOAPAM','SID',true),
('112','PRIMARA OFICIALIA DE SANTIAGO TEXTITLAN1','SIERRA SUR','SIRCO',true),
('150','SANTIAGOMILTEPEC','MIXTECA','SIRCO',true),
('99','SEGUNDA DE HUAJUPAN DE LEON','MIXTECA','SID',true),
('51','CHALCATONGO DE HIDALGO','MIXTECA','SID',true),
('151','SAN ESTEBAN ATATLAHUCA','MIXTECA','SIRCO',true),
('116','SEGUNDA OFICIALÍA','PAPALOAPAM','SID',true),
('91','SANTA MARÍA JACATEPEC, TUXTEPEC','PAPALOAPAM','SID',true),
('48','ZAPOTITLÁN LAGUNAS','MIXTECA','SIRCO',true),
('15','ACATLÁN DE PÉREZ FIGUEROA','PAPALOAPAM','SID',true),
('58','MARÍA LOMBARDO','SIERRA NORTE','SIRCO',true),
('131','YUTANDUCHI DE GUERRERO','MIXTECA','SIRCO',true),
('12','MODULO HOSPITALARIO RURAL NÚMERO 35 SANTIAGO JAMILTEPEC OAXACA','COSTA','SIRCO',false),
('','10 ITINERANTE SANTIAGO TLAZOYALTEPEC ETLA','VALLES CENTRALES','SID',true),
('42','SANTIAGO CHAZUMBA','MIXTECA','SIRCO',true),
('35','SAN AGUSTÍN LOXICHA','COSTA','SIRCO',true),
('89','SANTA MARÍA YUCUHITI','MIXTECA','SIRCO',true),
('1','OCOTLÁN DE MORELOS','VALLES CENTRALES','SID',true),
('37','SAN JUAN BAUTISTA CUICATLAN','CAÑADA','SIRCO',true),
('78','SANTIAGO IXTAYUTLA','COSTA','SIRCO',true),
('1','PRIMERA OFICIALIA DE OAXACA DE JUAREZ','VALLES CENTRALES','SID',true),
('87','SANTA MARÍA XADANI','ITSMO','SIRCO',true),
('106','SANTA MARÍA HUAZOLOTITLAN','COSTA','SIRCO',true),
('19','SANTIAGO CHOAPAM','SIERRA NORTE','SIRCO',true),
('90','SAN BLAS ATEMPA','ITSMO','SIRCO',true),
('82','SAN PEDRO IXCATLAN','PAPALOAPAM','SIRCO',true),
('1','PRIMERA OFICIALIA DE MIAHUATLAN','SIERRA SUR','SID',true),
('143','143 BENITO JUÁREZ SAN MIGUEL CHIMALAPA','ITSMO','SIRCO',true),
('76','GREGORIO MELCHOR FLORES','SIERRA NORTE','SIRCO',true),
('86','SAN JUAN MAZATLÁN','SIERRA NORTE','SID',true),
('22','CIUDAD IXTEPEC','ITSMO','SID',true),
('154','OFICIALÍA AYOTZINTEPEC','PAPALOAPAM','SID',true),
('','OFICIALIA DECIMA SEGUNDA ITINERANTE TURNO VESPERTINO','VALLES CENTRALES','SID',true),
('47','SANTIAGO TAMAZOLA','MIXTECA','SIRCO',false),
('12','MODULO HOSPITALARIO RURAL NUM 35 SANTIAGO JAMILTEPEC','COSTA','SIRCO',false);

INSERT INTO co_oficiales (nombres,ap1,ap2,username,tel,email,perfil,municipio,oficialia,region,sistema,sid,internet,starlink,activo,pendiente,obs) VALUES
('Mireya Oneida','Alavez','Gonzalez','AAGM960721MOCLNR00','','','OFICIALES','PINOTEPA DE DON LUIS',1,'','',false,false,false,true,false,''),
('Arturo','Alberto','Natividad','AENA821124HOCLTR05','','','OFICIALES','CHALCATONGO DE HIDALGO',1,'','',false,false,false,true,false,''),
('Victor','Antonio','Martinez','AOMV990307HOCNRC08','','','OFICIALES','SANTO DOMINGO ZANATEPEC',1,'','',false,false,false,true,false,''),
('Flavio Cesar','Bravo','Maldonado','BAMF981030HOCRLL03','','','OFICIALES','SAN GABRIEL MIXTEPEC',1,'','',false,false,false,true,false,''),
('Marcelo','Carreño','Gopar','CAGM721007HOCRPR08','','','OFICIALES','OAXACA DE JUAREZ',2,'','',false,false,false,true,false,''),
('Sabu Karim','Calvo','Perez','CAPS991006HOCLRB01','','','OFICIALES','ZIMATLAN DE ALVAREZ',1,'','',false,false,false,true,false,''),
('Juanita','Cabrera','Toledo','CATJ710825MOCBLN04','','','OFICIALES','SANTIAGO TLAZOYALTEPEC',10,'','',false,false,false,true,false,''),
('Josefina','Cortez','Aguirre','COAJ930420MOCRGS01','','','OFICIALES','ACATLAN DE PEREZ FIGUEROA',1,'','',false,false,false,true,false,''),
('Cecilia Gabriela','Colon','Lopez','COLC940303MGRLPC04','','','OFICIALES','SANTIAGO PINOTEPA NACIONAL',1,'','',false,false,false,true,false,''),
('Adriana Lizbeth','Cortes','Mendoza','COMA830308MOCRND07','','','OFICIALES','SAN BARTOLO COYOTEPEC',10,'','',false,false,false,true,false,''),
('Marilucy','Cruz','Loyola','CULM830309MOCRYR09','','','OFICIALES','SAN PEDRO TAPANATEPEC',1,'','',false,false,false,true,false,''),
('Eunice','Diaz','Cruz','DICE820514MOCZRN05','','','OFICIALES','TEOTITLAN DE FLORES MAGON',1,'','',false,false,false,true,false,''),
('Perfecto','Felipe','Trapaga','FETP761101HOCLRR00','','','OFICIALES','SAN FELIPE USILA',1,'','',false,false,false,true,false,''),
('Imelda','Garcia','Guerrero','GAGI910727MOCRRM06','','','OFICIALES','HUAUTLA DE JIMENEZ',1,'','',false,false,false,true,false,''),
('Jose Manuel','Garcia','Marin','GAMM881006HOCRRN04','','','OFICIALES','SAN JUAN BAUTISTA TUXTEPEC',1,'','',false,false,false,true,false,''),
('Cristobal','Garnica','Vazquez','GAVC820305HOCRZR03','','','OFICIALES','SANTA MARIA ECATEPEC',1,'','',false,false,false,true,false,''),
('Vilma Gloria','Gomez','Fierros','GOFV780322MOCMRL06','','','OFICIALES','SALINA CRUZ',2,'','',false,false,false,true,false,''),
('Carlos Alberto','Gomez','','GOXC750209HOCMXR04','','','OFICIALES','SAN BARTOLO COYOTEPEC',12,'','',false,false,false,true,false,''),
('Elizabeth','Gurrion','Matias','GUME551210MDFRTL04','','','OFICIALES','CIUDAD IXTEPEC',1,'','',false,false,false,true,false,''),
('Mario','Hernandez','Santiago','HESM770815HOCRNR01','','','OFICIALES','IXTLAN DE JUAREZ',1,'','',false,false,false,true,false,''),
('Gerson','Jarquin','Briones','JABG830322HOCRRR01','','','OFICIALES','MIAHUATLAN DE PORFIRIO DIAZ',2,'','',false,false,false,true,false,''),
('Rosana Meliza','Jimenez','Leal','JILR860428MOCMLS06','','','OFICIALES','ASUNCION NOCHIXTLAN',1,'','',false,false,false,true,false,''),
('Jose Manuel','Lagunes','Cruz','LACM890327HOCGRN01','','','OFICIALES','SAN JUAN BAUTISTA VALLE NACIONAL',1,'','',false,false,false,true,false,''),
('Nanaxhi Bellamar','Lopez','Antonio','LOAN920609MOCPNN09','','','OFICIALES','EL ESPINAL',1,'','',false,false,false,true,false,''),
('Oliva','Lopez','Lopez','LOLO760603MOCPPL07','','','OFICIALES','SAN PEDRO QUIATONI',1,'','',false,false,false,true,false,''),
('Jhoatzy','Lopez','Ordaz','LOOJ000704MOCPRHA3','','','OFICIALES','OAXACA DE JUAREZ',3,'','',false,false,false,true,false,''),
('Veronica','Lopez','Saldaña','LOSV730122MOCPLR06','','','OFICIALES','OAXACA DE JUAREZ',10,'','',false,false,false,true,false,''),
('Jorge','Marin','Alonso','MAAJ730603HOCRLR08','','','OFICIALES','UNION HIDALGO',1,'','',false,false,false,true,false,''),
('Gustavo Ruben','Matias','Cruz','MACG890527HOCTRS03','','','OFICIALES','VILLA DE ETLA',1,'','',false,false,false,true,false,''),
('Rosalia','Martinez','Carrasco','MACR761231MOCRRS01','','','OFICIALES','SALINA CRUZ',1,'','',false,false,false,true,false,''),
('Orlando','Marcial','Ferrer','MAFO950728HOCRRR00','','','OFICIALES','SAN JOSE CHILTEPEC',1,'','',false,false,false,true,false,''),
('Elizabeth','Marquez','Gonzalez','MAGE771209MDFRNL02','','','OFICIALES','SAN PABLO HUITZO',1,'','',false,false,false,true,false,''),
('Emmanuel','Martinez','Garcia','MAGE860507HOCRRM09','','','OFICIALES','MATIAS ROMERO AVENDAÑO',1,'','',false,false,false,true,false,''),
('Jesus','Martinez','Grijalva','MAGJ890822HOCRRS06','','','OFICIALES','SANTA CRUZ ITUNDUJIA',1,'','',false,false,false,true,false,''),
('Israel','Martinez','Prado','MAPI880826HOCRRS08','','','OFICIALES','SANTA MARIA CHILCHOTLA',1,'','',false,false,false,true,false,''),
('Gilberto','Mendoza','Cortes','MECG820204HOCNRL05','','','OFICIALES','MIAHUATLAN DE PORFIRIO DIAZ',1,'','',false,false,false,true,false,''),
('Angela','Melchor','Fuentes','MEFA731001MOCLNN09','','','OFICIALES','VILLA DE TUTUTEPEC DE MELCHOR OCAMPO',1,'','',false,false,false,true,false,''),
('Mariana','Memije','Lazo','MELM000812MOCMZRA3','','','OFICIALES','SANTIAGO JAMILTEPEC',1,'','',false,false,false,true,false,''),
('Ruben Francisco','Mendoza','Mendoza','MEMR890328HOCNNB07','','','OFICIALES','TLACOLULA DE MATAMOROS',1,'','',false,false,false,true,false,''),
('Yonatan','Mendoza','Ramirez','MERY940522HOCNMN07','','','OFICIALES','SANTO DOMINGO TEHUANTEPEC',1,'','',false,false,false,true,false,''),
('Constantino Pevig','Montesinos','Jose','MOJC881117HOCNSN00','','','OFICIALES','HEROICA CIUDAD DE TLAXIACO',1,'','',false,false,false,true,false,''),
('Alberto','Montes','Mendoza','MOMA840531HOCNNL06','','','OFICIALES','HEROICA CIUDAD DE HUAJUAPAN DE LEON',1,'','',false,false,false,true,false,''),
('Monserrat','Mondragon','Silva','MOSM990915MOCNLN07','','','OFICIALES','SAN JUAN CACAHUATEPEC',1,'','',false,false,false,true,false,''),
('Vianey Del Rosario','Orozco','Jimenez','OOJV860211MOCRMN00','','','OFICIALES','OAXACA DE JUAREZ',6,'','',false,false,false,true,false,''),
('Yaret','Pascual','Mendez','PAMY980418MOCSNR05','','','OFICIALES','OAXACA DE JUAREZ',4,'','',false,false,false,true,false,''),
('William De Jesus','Perez','Garcia','PEGW921024HOCRRL05','','','OFICIALES','OAXACA DE JUAREZ',1,'','',false,false,false,true,false,''),
('Virginia Del Carmen','Perez','Ordoñez','PEOV901224MOCRRR09','','','OFICIALES','MAGDALENA TEQUISISTLAN',1,'','',false,false,false,true,false,''),
('Ericka','Quijano','Pablo','QUPE821129MOCJBR03','','','OFICIALES','SAN JUAN BAUTISTA TUXTEPEC',2,'','',false,false,false,true,false,''),
('Fermin','Ramirez','Garcia','RAGF770707HOCMRR07','','','OFICIALES','SANTA MARIA HUATULCO',1,'','',false,false,false,true,false,''),
('Fernando','Rios','Lazaro','RILF870623HOCSZR07','','','OFICIALES','SAN BARTOLOME ZOOGOCHO',1,'','',false,false,false,true,false,''),
('Elsa','Rodriguez','Ramos','RORE660415MOCDML03','','','OFICIALES','SAN JUAN BAUTISTA COIXTLAHUACA',1,'','',false,false,false,true,false,''),
('Lennin','Ruiz','Mendoza','RUML810731HOCZNN07','','','OFICIALES','SANTA MARIA JALAPA DEL MARQUES',1,'','',false,false,false,true,false,''),
('Cruz','Sanchez','Hernandez','SAHC860503HOCNRR00','','','OFICIALES','HEROICA VILLA TEZOATLAN DE SEGURA Y LUNA',1,'','',false,false,false,true,false,''),
('Domingo','Sampedro','Salazar','SASD830227HOCMLM00','','','OFICIALES','HEROICA CIUDAD DE HUAJUAPAN DE LEON',2,'','',false,false,false,true,false,''),
('Neptali','Santiago','Santiago','SASN780201HOCNNP08','','','OFICIALES','SANTO DOMINGO TEPUXTEPEC',1,'','',false,false,false,true,false,''),
('Jose Carlos','San Juan','Vasquez','SAVC940414HOCNSR00','','','OFICIALES','OCOTLAN DE MORELOS',1,'','',false,false,false,true,false,''),
('Daniela','Santiago','Ventura','SAVD791211MOCNNN04','','','OFICIALES','VILLA DE ZAACHILA',1,'','',false,false,false,true,false,''),
('Jannel Iridian','Sanchez','Zurita','SAZJ000620MBCNRNA0','','','OFICIALES','COSOLAPA',1,'','',false,false,false,true,false,''),
('Yedith','Toledo','Cruz','TOCY811105MOCLRD06','','','OFICIALES','HEROICA CIUDAD DE JUCHITAN DE ZARAGOZA',1,'','',false,false,false,true,false,''),
('Jesus Alberto','Toscano','Miguel','TOMJ930223HOCSGS05','','','OFICIALES','MATIAS ROMERO AVENDAÑO',2,'','',false,false,false,true,false,''),
('Ana Estela','Torres','Perez','TOPA811128MOCRRN05','','','OFICIALES','OAXACA DE JUAREZ',5,'','',false,false,false,true,false,''),
('Manuel Alejandro','Urrutia','Sanchez','UUSM741005HOCRNN00','','','OFICIALES','SANTIAGO JUXTLAHUACA',1,'','',false,false,false,true,false,''),
('Lorena Yamileth','Valencia','Canseco','VACL911024MOCLNR06','','','OFICIALES','SAN PEDRO MIXTEPEC -DTO. 22 -',1,'','',false,false,false,true,false,''),
('Pedro Arturo','Vasquez','Esteva','VAEP651215HOCSSD09','','','OFICIALES','SANTA CRUZ XOXOCOTLAN',1,'','',false,false,false,true,false,''),
('Eva Epifania','Vargas','Jimenez','VAJE730715MOCRMV04','','','OFICIALES','SAN PEDRO Y SAN PABLO AYUTLA',1,'','',false,false,false,true,false,''),
('Jaime','Vasquez','Santiago','VASJ790715HOCSNM02','','','OFICIALES','HEROICA CIUDAD DE EJUTLA DE CRESPO',1,'','',false,false,false,true,false,''),
('Jose Carlos','Velazquez','Mariscal','VEMC780326HMCLRR02','','','OFICIALES','SAN PEDRO POCHUTLA',1,'','',false,false,false,true,false,''),
('Maximiliano','Vega','Marquez','VEMM550214HOCGRX04','','','OFICIALES','SANTO DOMINGO PETAPA',1,'','',false,false,false,true,false,''),
('Gloria Jazmin','Sosa','Lozano','SOLG980411MOCSZL09','','','OFICIALES','SANTA MARIA JACATEPEC',1,'','',false,false,false,true,false,''),
('Berenice','Alonso','Zavaleta','AOZB960730MOCLVR03','','','OFICIALES','MIAHUATLAN DE PORFIRIO DIAZ',12,'','',false,false,false,true,false,''),
('Elva Yelitza','Santiago','Lopez','SALE950718MOCNPL07','','','OFICIALES','SAN PABLO GUILA',2,'','',false,false,false,true,false,''),
('Fernanda Yolidayni','Salazar','Matias','SAMF991103MMCLTR07','','','OFICIALES','MARISCALA DE JUAREZ',1,'','',false,false,false,true,false,''),
('Miguel Anastasio','Ortiz','Aparicio','OIAM910929HOCRPG00','','','OFICIALES','VILLA DE MITLA',1,'','',false,false,false,true,false,''),
('Luis Alejandro','Chavez','Escobedo','CAEL960114HOCHSS03','','','OFICIALES','SAN FRANCISCO TELIXTLAHUACA',1,'','',false,false,false,true,false,''),
('Etelberto Rey','Garcia','Romero','GARE590303HOCRMT06','','','OFICIALES','SAN JUAN GUICHICOVI',1,'','',false,false,false,true,false,''),
('Maria Guadalupe','Hernandez','Bautista','HEBG991118MOCRTD00','','','OFICIALES','SANTA CATARINA JUQUILA',1,'','',false,false,false,true,false,''),
('Sebastian','Aragon','Acevedo','AAAS691228HOCRCB04','9512402998','','USUARIO LOCAL','SAN BLAS ATEMPA',1,'','',false,false,false,true,true,''),
('Laura Grisel','Arzola','Lopez','AOLL970608MOCRPR08','9531755407','','OFICIALES','SILACAYOAPAM',1,'','',false,false,false,true,true,''),
('Ignacio','Agustin','Lopez','AULI970701HOCGPG09','9711948371','','OFICIALES','SAN CARLOS YAUTEPEC',1,'','',false,false,false,true,true,''),
('Elizabeth','Aguirre','De Los Santos','AUSE791123MOCGNL06','9513454353','','USUARIO LOCAL','SANTA MARIA HUAZOLOTITLAN',1,'','',false,false,false,true,true,'');

UPDATE co_oficiales o
SET sistema = (SELECT of.sistema FROM co_oficialias of WHERE of.id = o.oficialia)
WHERE sistema = '';