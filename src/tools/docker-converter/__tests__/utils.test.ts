import { describe, it, expect } from 'vitest';
import { dockerRunToCompose, dockerComposeToRun } from '../utils';

describe('Docker Converter Utilities', () => {
  describe('dockerRunToCompose', () => {
    it('should convert standard docker run command to docker-compose YAML', () => {
      const cmd = 'docker run -d --name my-app -p 8080:80 -v /data:/app/data -e NODE_ENV=production nginx:latest';
      const res = dockerRunToCompose(cmd);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toContain("version: '3.8'");
        expect(res.data).toContain('image: nginx:latest');
        expect(res.data).toContain('container_name: my-app');
        expect(res.data).toContain('- "8080:80"');
        expect(res.data).toContain('- "/data:/app/data"');
        expect(res.data).toContain('- NODE_ENV=production');
      }
    });

    it('should return empty data for empty command string', () => {
      const res = dockerRunToCompose('  ');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('');
      }
    });

    it('should return error if command does not start with "docker run"', () => {
      const res = dockerRunToCompose('docker exec -it my-container bash');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Command must start with "docker run"');
      }
    });

    it('should return error if image name is missing', () => {
      const res = dockerRunToCompose('docker run -d --name test-app');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Could not detect image name in the docker run command.');
      }
    });
  });

  describe('dockerComposeToRun', () => {
    it('should convert valid docker-compose YAML to docker run command', async () => {
      const yaml = `
version: '3.8'
services:
  web:
    image: nginx:alpine
    container_name: web-server
    ports:
      - "80:80"
    environment:
      - PORT=80
`;
      const res = await dockerComposeToRun(yaml);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toContain('docker run -d');
        expect(res.data).toContain('--name web-server');
        expect(res.data).toContain('-p 80:80');
        expect(res.data).toContain('-e "PORT=80"');
        expect(res.data).toContain('nginx:alpine');
      }
    });

    it('should return error for invalid compose structure missing services key', async () => {
      const yaml = `
version: '3.8'
invalid_root: true
`;
      const res = await dockerComposeToRun(yaml);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('Invalid docker-compose.yml structure');
      }
    });
  });
});
