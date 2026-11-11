FROM golang:1.25-alpine AS build
RUN go install github.com/stripe/pg-schema-diff/cmd/pg-schema-diff@v1.0.9

FROM alpine:3.22
COPY --from=build /go/bin/pg-schema-diff /usr/local/bin/pg-schema-diff
ENTRYPOINT ["pg-schema-diff"]
