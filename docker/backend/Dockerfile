FROM ghcr.io/astral-sh/uv:python3.12-bookworm AS base

WORKDIR /app

# 配置APT清华源 (简化版本)
RUN echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware" > /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list

# 清理APT缓存和配置
RUN rm -rf /etc/apt/sources.list.d/* || true && \
    apt-get clean || true && \
    rm -rf /var/lib/apt/lists/* || true

# Install system dependencies
RUN  apt-get update && rm -rf /var/lib/apt/lists/*

# Improve layer caching and avoid network during runtime
ENV UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=0 \
    UV_INDEX=https://mirrors.aliyun.com/pypi/simple

# Copy lockfile and project metadata first for better caching, install deps only
COPY pyproject.toml uv.lock ./
# Use BuildKit cache for uv to speed up repeated dependency resolution
RUN --mount=type=cache,id=uv-cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev -i https://mirrors.aliyun.com/pypi/simple

# Now add project sources and install the project into the virtualenv
COPY src ./src
COPY README.md README.md
RUN --mount=type=cache,id=uv-cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev -i https://mirrors.aliyun.com/pypi/simple

# Expose the .venv on PATH so runtime doesn't need uv
ENV PATH="/app/.venv/bin:${PATH}"

# Default envs (can be overridden by compose)
ENV MAGENTIC_UI_API_DOCS=true \
    _APPDIR=/data/appdir

# Ensure Playwright browsers are available in the image (no runtime download)
# Use a fixed browsers path and a CN mirror to improve reliability in restricted networks
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright \
    DEBIAN_FRONTEND=noninteractive

# Install Chromium variants and their system dependencies for Playwright
RUN playwright install --with-deps chromium chromium-headless-shell

# Create necessary directories
RUN mkdir -p /data/appdir /data/config

EXPOSE 8081

# Run and bind to all interfaces so it's reachable outside the container
CMD ["magentic-ui", "--host", "0.0.0.0", "--port", "8081"]

