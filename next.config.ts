import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empacota o servidor com só as dependências usadas — a imagem Docker
  // copia .next/standalone e dispensa node_modules inteiro.
  output: "standalone",
  images: {
    remotePatterns: [
      // Fotos dos imóveis mockados. Trocar pelo domínio do storage real depois.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // @react-pdf/renderer usa APIs de Node e não deve ser empacotado pelo bundler.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
