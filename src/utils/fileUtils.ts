import SparkMD5 from 'spark-md5';

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  hashes: {
    sha256?: string;
    sha1?: string;
    md5?: string;
  };
}

export class FileUtils {
  static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  static async computeHash(algo: 'SHA-256' | 'SHA-1', buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static computeMD5(buffer: ArrayBuffer): string {
    const spark = new SparkMD5.ArrayBuffer();
    spark.append(buffer);
    return spark.end();
  }

  static async getFileInfo(file: File): Promise<FileInfo> {
    const buffer = await this.readFileAsArrayBuffer(file);

    const [sha256, sha1] = await Promise.all([
      this.computeHash('SHA-256', buffer),
      this.computeHash('SHA-1', buffer),
    ]);
    const md5 = this.computeMD5(buffer);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      hashes: { sha256, sha1, md5 },
    };
  }
}
