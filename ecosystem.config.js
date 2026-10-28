export default {
  apps: [
    {
      name: "api-service",
      script: "./dist/index.js",      // Path relative to the 'cwd'
      cwd: "./apps/api",              // Tells PM2 to run from the api folder root
      instances: "max",               // Utilizes all CPU cores (Cluster mode)
      exec_mode: "cluster",           // Enables zero-downtime reloads
      env: {
        NODE_ENV: "production"        // Forces production mode
      }
    }
  ]
};