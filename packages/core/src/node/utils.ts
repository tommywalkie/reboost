import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';

import fs from 'fs';
import path from 'path';

export type DeepRequire<T> = T extends Record<string, any> ? {
  [P in keyof T]-?: DeepRequire<T[P]>;
} : T;

export type DeepFrozen<T> = T extends Record<string, any> ? {
  readonly [P in keyof T]: DeepFrozen<T[P]>;
} : T extends any[] ? readonly T[] : T;

export const uniqueID = (length = 32) => Array(length).fill(0).map(() => (Math.random() * 16 | 0).toString(16)).join('');

export const isObject = (data: any) => !!data && data.constructor === Object;

export const merge = <T extends Record<string, any>>(source: T, target: Partial<T>) => {
  for (const key in target) {
    if (isObject(source[key]) && isObject(target[key])) {
      merge(source[key], target[key]);
    } else {
      source[key] = target[key];
    }
  }
  return source;
}

export const clone = <T = any>(object: T): T => {
  const cloned = Array.isArray(object) ? [] : {} as any;
  for (const key in object) {
    if (isObject(object[key]) || Array.isArray(object[key])) {
      cloned[key] = clone(object[key]);
      continue;
    }
    cloned[key] = object[key];
  }
  return cloned;
}

export const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

export const isDir = (dirPath: string) => fs.lstatSync(dirPath).isDirectory();

export const rmDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) return;
  fs.readdirSync(dirPath).forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (isDir(filePath)) return rmDir(filePath);
    fs.unlinkSync(filePath);
  });
  fs.rmdirSync(dirPath);
}

export const deepFreeze = (obj: any) => {
  for (const key in obj) {
    if (isObject(obj[key]) || Array.isArray(obj[key])) {
      deepFreeze(obj[key]);
    }
  }
  return Object.freeze(obj);
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const bind = <T extends Function>(func: T, bindTo: ThisParameterType<T>): OmitThisParameter<T> => func.bind(bindTo);

export const diff = <T>(oldA: T[], newA: T[]) => ({
  added: newA.filter((a) => !oldA.includes(a)),
  removed: oldA.filter((a) => !newA.includes(a))
})

export const isVersionLessThan = (version: string, toCompareWith: string) => {
  const [aMajor, aMinor, aPatch] = version.split('.').map(Number);
  const [bMajor, bMinor, bPatch] = toCompareWith.split('.').map(Number);

  if (aMajor < bMajor) return true;
  if (aMinor < bMinor) return true;
  if (aPatch < bPatch) return true;

  return false;
}

const isUndefOrNull = (d: any) => d === null || d === undefined;

/**
 * Forked version of merge-source-map
 * Original author KATO Kei
 * Licensed under MIT License - https://github.com/keik/merge-source-map/blob/master/LICENSE
 */
export const mergeSourceMaps = async (oldMap: RawSourceMap, newMap: RawSourceMap) => {
  if (!oldMap) return newMap;
  if (!newMap) return oldMap;

  const oldMapConsumer = await new SourceMapConsumer(oldMap);
  const newMapConsumer = await new SourceMapConsumer(newMap);
  const mergedMapGenerator = new SourceMapGenerator();

  newMapConsumer.eachMapping((m) => {
    if (isUndefOrNull(m.originalLine)) return;

    const origPosInOldMap = oldMapConsumer.originalPositionFor({
      line: m.originalLine,
      column: m.originalColumn
    });

    if (isUndefOrNull(origPosInOldMap.source)) return;

    mergedMapGenerator.addMapping({
      original: {
        line: origPosInOldMap.line,
        column: origPosInOldMap.column
      },
      generated: {
        line: m.generatedLine,
        column: m.generatedColumn
      },
      source: origPosInOldMap.source,
      name: origPosInOldMap.name
    });
  });

  const consumers = [newMapConsumer, oldMapConsumer];
  consumers.forEach((consumer) => {
    consumer.sources.forEach((sourceFile) => {
      const sourceContent = consumer.sourceContentFor(sourceFile);
      if (!isUndefOrNull(sourceContent)) {
        mergedMapGenerator.setSourceContent(sourceFile, sourceContent);
      }
    });
  });

  return JSON.parse(mergedMapGenerator.toString()) as RawSourceMap;
}
