FROM node:14-alpine

# Install basic development tools
RUN apk update && apk add --no-cache build-base git python3 py3-pip gcc g++ make
# Install additional tools
RUN apk add --no-cache bash curl jq openssl
# Install Docker CLI (optional, uncomment if needed)

# RUN apk add --no-cache docker-cli

# Set working directory
WORKDIR /app

# Default command
CMD ["/bin/sh"]