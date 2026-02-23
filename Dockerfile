FROM clojure:tools-deps-trixie-slim

ARG BABASHKA_VERSION=1.12.212
ARG CLOJURE_MCP_LIGHT_TAG=v0.2.1
ARG TARGETARCH

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  bash \
  build-essential \
  ca-certificates \
  curl \
  tmux \
  git \
  nodejs \
  npm \
  openjdk-21-jdk \
  rlwrap \
  ripgrep \
  unzip \
  xz-utils \
  && rm -rf /var/lib/apt/lists/*

RUN case "${TARGETARCH}" in \
  amd64) BB_ARCH="amd64" ;; \
  arm64) BB_ARCH="aarch64" ;; \
  *) echo "Unsupported TARGETARCH: ${TARGETARCH}" && exit 1 ;; \
  esac \
  && curl -fsSL "https://github.com/babashka/babashka/releases/download/v${BABASHKA_VERSION}/babashka-${BABASHKA_VERSION}-linux-${BB_ARCH}-static.tar.gz" \
  | tar -xz -C /usr/local/bin bb

RUN npm install -g @mariozechner/pi-coding-agent@0.54.2

RUN useradd --create-home --shell /bin/bash piuser
ENV NPM_CONFIG_PREFIX="/home/piuser/.npm-global"
ENV PATH="/home/piuser/.npm-global/bin:/home/piuser/.local/bin:${PATH}"

RUN mkdir -p /home/piuser/.local/bin /home/piuser/.npm-global \
  && curl -o- -L https://raw.githubusercontent.com/babashka/bbin/v0.2.4/bbin > /home/piuser/.local/bin/bbin \
  && chmod +x /home/piuser/.local/bin/bbin \
  && chown -R piuser:piuser /home/piuser/.local /home/piuser/.npm-global

USER piuser

RUN git config --global --add safe.directory /workspace

RUN bbin install https://github.com/bhauman/clojure-mcp-light.git --tag "${CLOJURE_MCP_LIGHT_TAG}" --as clj-paren-repair --main-opts '["-m" "clojure-mcp-light.paren-repair"]' \
  && bbin install https://github.com/bhauman/clojure-mcp-light.git --tag "${CLOJURE_MCP_LIGHT_TAG}" --as clj-nrepl-eval --main-opts '["-m" "clojure-mcp-light.nrepl-eval"]'

USER root

RUN cat > /usr/local/bin/cljfmt <<'EOF' \
  && chmod +x /usr/local/bin/cljfmt
#!/usr/bin/env bash
exec clojure -Sdeps '{:deps {dev.weavejester/cljfmt {:mvn/version "0.13.0"}}}' -M -m cljfmt.main "$@"
EOF

WORKDIR /workspace
RUN chown -R piuser:piuser /workspace

USER piuser

CMD ["bash"]
