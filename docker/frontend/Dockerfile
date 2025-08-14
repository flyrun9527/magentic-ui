# syntax=docker/dockerfile:1

########################
# Build stage (frontend)
########################
FROM node:20-bookworm AS builder

WORKDIR /app/frontend

# 配置APT清华源 (简化版本)
RUN echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware" > /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian-security bookworm-security main contrib non-free non-free-firmware" >> /etc/apt/sources.list

# 清理APT缓存和配置
RUN rm -rf /etc/apt/sources.list.d/* || true && \
    apt-get clean || true && \
    rm -rf /var/lib/apt/lists/* || true
    
# Build deps for sharp/gatsby
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    ca-certificates \
    curl \
    pkg-config \
    libvips \
    libvips-dev \
    build-essential \
    libglib2.0-0 \
    libglib2.0-dev \
  && rm -rf /var/lib/apt/lists/*

# Use yarn via corepack
RUN corepack enable

# RUN npm config set registry https://registry.npmmirror.com
# ENV npm_config_sharp_libvips_binary_host="https://registry.npmmirror.com/mirrors/sharp-libvips"
# ENV npm_config_sharp_binary_host="https://registry.npmmirror.com/mirrors/sharp"

# # Speed up sharp binary download in China
# RUN yarn config set sharp_binary_host=https://npmmirror.com/mirrors/sharp
# RUN yarn config set sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips
# # ENV SHARP_DIST_BASE_URL="https://dgithub.xyz/lovell/sharp-libvips/releases/download/v8.14.5/"
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=false
# Copy manifests first for caching
COPY frontend/package.json frontend/yarn.lock ./

# Set China mirrors for faster installs
# RUN yarn config set registry https://registry.npmmirror.com \
#  && yarn config set network-timeout 600000 

# Install dependencies
RUN SHARP_IGNORE_GLOBAL_LIBVIPS=false yarn install

# Copy source
COPY frontend/ .

# Build Gatsby static site to /app/frontend/public
RUN npx gatsby clean && \
    PREFIX_PATH_VALUE='' npx gatsby build --prefix-paths

########################
# Runtime stage
########################
FROM nginx:alpine

# Nginx config (path relative to build context root)
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Serve built site
COPY --from=builder /app/frontend/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

