module.exports = {
  apps: [
    {
      name: 'db-weave-api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: '.env',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true
    }
  ]
}
