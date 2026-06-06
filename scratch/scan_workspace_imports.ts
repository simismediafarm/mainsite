import * as fs from 'fs';
import * as path from 'path';
import glob from 'fast-glob';

interface PackageInfo {
  dir: string;
  name: string;
  dependencies: Set<string>;
  devDependencies: Set<string>;
  allDeps: Set<string>;
  hasBuildScript: boolean;
  hasTsConfig: boolean;
  mainField?: string;
  typesField?: string;
}

const rootDir = '/Users/mac/Downloads/PROYEK/SIMIS';

function getPackages(): PackageInfo[] {
  const packages: PackageInfo[] = [];
  const searchDirs = [
    path.join(rootDir, 'apps'),
    path.join(rootDir, 'packages')
  ];

  for (const baseDir of searchDirs) {
    if (!fs.existsSync(baseDir)) continue;
    const subdirs = fs.readdirSync(baseDir);
    for (const subdir of subdirs) {
      const fullPath = path.join(baseDir, subdir);
      if (!fs.statSync(fullPath).isDirectory()) continue;
      const pkgJsonPath = path.join(fullPath, 'package.json');
      if (!fs.existsSync(pkgJsonPath)) continue;

      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const deps = new Set<string>(Object.keys(pkgJson.dependencies || {}));
        const devDeps = new Set<string>(Object.keys(pkgJson.devDependencies || {}));
        const allDeps = new Set<string>([...deps, ...devDeps]);
        const hasBuildScript = !!(pkgJson.scripts && pkgJson.scripts.build);
        const hasTsConfig = fs.existsSync(path.join(fullPath, 'tsconfig.json'));

        packages.push({
          dir: fullPath,
          name: pkgJson.name || subdir,
          dependencies: deps,
          devDependencies: devDeps,
          allDeps,
          hasBuildScript,
          hasTsConfig,
          mainField: pkgJson.main,
          typesField: pkgJson.types,
        });
      } catch (err) {
        console.error(`Error parsing ${pkgJsonPath}:`, err);
      }
    }
  }
  return packages;
}

function getBasePackageName(importPath: string): string {
  // e.g. "@simis/shared/dist/foo" -> "@simis/shared"
  const parts = importPath.split('/');
  if (parts.length >= 2 && parts[0].startsWith('@')) {
    return `${parts[0]}/${parts[1]}`;
  }
  return importPath;
}

function scanImports(pkg: PackageInfo): { file: string; imported: string }[] {
  const files = glob.sync(['**/*.{ts,tsx,js,jsx}'], {
    cwd: pkg.dir,
    ignore: ['node_modules/**', 'dist/**', '.next/**', 'coverage/**', 'build/**'],
    absolute: true
  });

  const missingImports: { file: string; imported: string }[] = [];
  const importRegex = /(?:import|export)\s+.*?\s+from\s+['"](@simis\/[^'"]+)['"]/g;
  const requireRegex = /(?:require|import)\(['"](@simis\/[^'"]+)['"]\)/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;

    // reset regex index
    importRegex.lastIndex = 0;
    while ((match = importRegex.exec(content)) !== null) {
      const imported = match[1];
      const baseName = getBasePackageName(imported);
      if (baseName !== pkg.name && !pkg.allDeps.has(baseName)) {
        missingImports.push({ file, imported: baseName });
      }
    }

    requireRegex.lastIndex = 0;
    while ((match = requireRegex.exec(content)) !== null) {
      const imported = match[1];
      const baseName = getBasePackageName(imported);
      if (baseName !== pkg.name && !pkg.allDeps.has(baseName)) {
        missingImports.push({ file, imported: baseName });
      }
    }
  }

  return missingImports;
}

function run() {
  const pkgs = getPackages();
  const pkgNames = new Set(pkgs.map(p => p.name));
  
  console.log(`Found ${pkgs.length} packages in workspace.`);
  let totalIssues = 0;

  for (const pkg of pkgs) {
    console.log(`\n--- Package: ${pkg.name} (${path.relative(rootDir, pkg.dir)}) ---`);
    
    // Check main and types fields if it's a shared package
    if (pkg.dir.includes('/packages/')) {
      if (!pkg.mainField || !pkg.mainField.startsWith('dist/')) {
        console.warn(`⚠️  Warning: [Main field] "${pkg.mainField}" does not start with "dist/".`);
        totalIssues++;
      }
      if (!pkg.typesField || !pkg.typesField.startsWith('dist/')) {
        console.warn(`⚠️  Warning: [Types field] "${pkg.typesField}" does not start with "dist/".`);
        totalIssues++;
      }
      if (!pkg.hasBuildScript) {
        console.warn(`⚠️  Warning: Missing build script.`);
        totalIssues++;
      }
      if (!pkg.hasTsConfig) {
        console.warn(`⚠️  Warning: Missing tsconfig.json.`);
        totalIssues++;
      }
    }

    // Scan imports
    const missing = scanImports(pkg);
    if (missing.length > 0) {
      const grouped = new Map<string, string[]>();
      for (const m of missing) {
        if (!grouped.has(m.imported)) {
          grouped.set(m.imported, []);
        }
        grouped.get(m.imported)!.push(path.relative(pkg.dir, m.file));
      }

      console.error(`❌  Missing package.json dependencies:`);
      for (const [imported, files] of grouped.entries()) {
        console.error(`    - "${imported}" is imported in:`);
        for (const file of files) {
          console.error(`        ${file}`);
        }
        totalIssues++;
      }
    } else {
      console.log(`✅  No missing workspace imports.`);
    }
  }

  console.log(`\nTotal configuration / dependency issues found: ${totalIssues}`);
}

run();
