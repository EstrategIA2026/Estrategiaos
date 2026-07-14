import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Desativa pre-render paralelo de rotas dinamicas ([section]/[entity])
  // via Turbopack. O worker de child process do Turbopack trava quando o
  // app chama IA externa (gateways com latencia alta) na mesma janela.
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
