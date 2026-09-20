import { describe, it, expect } from 'vitest';
import { dockerRunToCompose, dockerComposeToRun } from '../utils';

describe('Docker Converter Utilities', () => {
  it('should convert docker run command to compose YAML', () => {
    const cmd = 'docker run -d --name my-web -p 8080:80 -v /data:/app/data -e NODE_ENV=production nginx:latest';
    const res = dockerRunToCompose(cmd);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toContain("version: '3.8'");
      expect(res.data).toContain('services:');
      expect(res.data).toContain('my-web:');
      expect(res.data).toContain('image: nginx:latest');
      expect(res.data).toContain('- "8080:80"');
      expect(res.data).toContain('- "/data:/app/data"');
      expect(res.data).toContain('- NODE_ENV=production');
    }
  });

  it('should convert docker-compose YAML to docker run command', async () => {
    const yaml = `
      version: '3.8'
      services:
        web:
          image: nginx:alpine
          container_name: custom-nginx
          ports:
            - "80:80"
          environment:
            - PORT=80
    `;
    const res = await dockerComposeToRun(yaml);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toContain('docker run -d');
      expect(res.data).toContain('--name custom-nginx');
      expect(res.data).toContain('-p 80:80');
      expect(res.data).toContain('-e "PORT=80"');
      expect(res.data).toContain('nginx:alpine');
    }
  });

  it('should return error for invalid commands or yaml', async () => {
    expect(dockerRunToCompose('invalid command').success).toBe(false);

    const res = await dockerComposeToRun('invalid: [ yaml');
    expect(res.success).toBe(false);
  });
});
