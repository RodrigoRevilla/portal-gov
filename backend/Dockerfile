FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o portal-gov-api .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/portal-gov-api .
COPY .env.docker .env
EXPOSE 9090
CMD ["./portal-gov-api"]