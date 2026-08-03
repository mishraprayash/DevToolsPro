export interface DockerComposeConfig {
  version: string;
  services: {
    [serviceName: string]: {
      image: string;
      container_name?: string;
      ports?: string[];
      volumes?: string[];
      environment?: string[] | { [key: string]: string };
      restart?: string;
      networks?: string[];
    };
  };
}

interface ComposeService {
  container_name?: string;
  image?: string;
  ports?: string[];
  volumes?: string[];
  environment?: string[] | Record<string, string>;
  restart?: string;
  networks?: string[];
}

export function dockerRunToCompose(runCommand: string): { success: true; data: string } | { success: false; error: string } {
  try {
    const cleanCmd = runCommand
      .replace(/\\\n/g, ' ') // join multiline commands
      .replace(/\s+/g, ' ')  // normalize spaces
      .trim();

    if (!cleanCmd) {
      return { success: true, data: '' };
    }

    if (!cleanCmd.startsWith('docker run')) {
      return { success: false, error: 'Command must start with "docker run"' };
    }

    const args: string[] = [];
    let currentArg = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < cleanCmd.length; i++) {
      const char = cleanCmd[i];
      if ((char === '"' || char === "'") && cleanCmd[i - 1] !== '\\') {
        if (inQuotes && quoteChar === char) {
          inQuotes = false;
        } else if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        }
      } else if (char === ' ' && !inQuotes) {
        if (currentArg) {
          args.push(currentArg);
          currentArg = '';
        }
      } else {
        currentArg += char;
      }
    }
    if (currentArg) {
      args.push(currentArg);
    }

    let image = '';
    let containerName = '';
    const ports: string[] = [];
    const volumes: string[] = [];
    const environment: Record<string, string> = {};
    let restart = '';
    const networks: string[] = [];

    // Parse options
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('-')) {
        // Option parsing
        if (arg === '-p' || arg === '--publish') {
          ports.push(args[++i].replace(/['"]/g, ''));
        } else if (arg === '-v' || arg === '--volume') {
          volumes.push(args[++i].replace(/['"]/g, ''));
        } else if (arg === '-e' || arg === '--env') {
          const envVal = args[++i].replace(/['"]/g, '');
          const splitIdx = envVal.indexOf('=');
          if (splitIdx !== -1) {
            const key = envVal.substring(0, splitIdx);
            const val = envVal.substring(splitIdx + 1);
            environment[key] = val;
          } else {
            environment[envVal] = '';
          }
        } else if (arg === '--name') {
          containerName = args[++i].replace(/['"]/g, '');
        } else if (arg === '--restart') {
          restart = args[++i].replace(/['"]/g, '');
        } else if (arg === '--network' || arg === '--net') {
          networks.push(args[++i].replace(/['"]/g, ''));
        } else if (arg === '-d' || arg === '--detach') {
          // ignore detach flag
        } else if (arg.startsWith('-p')) {
          ports.push(arg.slice(2));
        } else if (arg.startsWith('-v')) {
          volumes.push(arg.slice(2));
        } else if (arg.startsWith('-e')) {
          const envVal = arg.slice(2);
          const splitIdx = envVal.indexOf('=');
          if (splitIdx !== -1) {
            environment[envVal.substring(0, splitIdx)] = envVal.substring(splitIdx + 1);
          }
        }
      } else {
        // First non-option is the image name
        image = arg;
        break; // Ignore anything after image name like CMD
      }
    }

    if (!image) {
      return { success: false, error: 'Could not detect image name in the docker run command.' };
    }

    const serviceName = containerName || image.split(':')[0].split('/').pop() || 'web';

    let yaml = `version: '3.8'\n\nservices:\n  ${serviceName}:\n    image: ${image}\n`;
    if (containerName) {
      yaml += `    container_name: ${containerName}\n`;
    }
    if (ports.length > 0) {
      yaml += `    ports:\n`;
      ports.forEach(p => yaml += `      - "${p}"\n`);
    }
    if (volumes.length > 0) {
      yaml += `    volumes:\n`;
      volumes.forEach(v => yaml += `      - "${v}"\n`);
    }
    if (Object.keys(environment).length > 0) {
      yaml += `    environment:\n`;
      Object.entries(environment).forEach(([k, v]) => yaml += `      - ${k}=${v}\n`);
    }
    if (restart) {
      yaml += `    restart: ${restart}\n`;
    }
    if (networks.length > 0) {
      yaml += `    networks:\n`;
      networks.forEach(n => yaml += `      - ${n}\n`);
    }

    return { success: true, data: yaml.trim() };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Conversion error' };
  }
}

export async function dockerComposeToRun(composeYaml: string): Promise<{ success: true; data: string } | { success: false; error: string }> {
  try {
    const yaml = (await import('js-yaml')).default;
    const parsed = yaml.load(composeYaml) as unknown as { services?: Record<string, ComposeService> };

    if (!parsed || !parsed.services) {
      return { success: false, error: 'Invalid docker-compose.yml structure: "services" key not found' };
    }

    const runCommands: string[] = [];

    Object.entries(parsed.services).forEach(([serviceName, service]) => {
      let cmd = 'docker run -d';
      
      if (service.container_name) {
        cmd += ` --name ${service.container_name}`;
      } else {
        cmd += ` --name ${serviceName}`;
      }

      if (service.ports) {
        service.ports.forEach((p: string) => cmd += ` -p ${p}`);
      }

      if (service.volumes) {
        service.volumes.forEach((v: string) => cmd += ` -v ${v}`);
      }

      if (service.environment) {
        if (Array.isArray(service.environment)) {
          service.environment.forEach((env: string) => cmd += ` -e "${env}"`);
        } else {
          Object.entries(service.environment).forEach(([k, v]) => cmd += ` -e "${k}=${v}"`);
        }
      }

      if (service.restart) {
        cmd += ` --restart ${service.restart}`;
      }

      if (service.networks) {
        service.networks.forEach((n: string) => cmd += ` --network ${n}`);
      }

      if (service.image) {
        cmd += ` ${service.image}`;
      } else {
        cmd += ` <image>`;
      }

      runCommands.push(cmd);
    });

    return { success: true, data: runCommands.join('\n\n') };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Conversion error' };
  }
}
