'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  CircularProgress
} from '@mui/material';
import { FileUtils, FileInfo } from '../utils/fileUtils';
import { getTranslations as t } from '../../locales';
// interface FileInfoDialogProps {
//   file: File | null;
//   display: boolean;
//   onClose: () => void;
// }

const FileInfoDialog = ({ file, display, onClose }) => {
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (display && file) {
      setLoading(true);
      FileUtils.getFileInfo(file)
        .then(info => setFileInfo(info))
        .finally(() => setLoading(false));
    } else {
      setFileInfo(null); // reset when hidden
    }
  }, [file, display]);

  return (
    <Dialog open={display} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('fi_file_info')}</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : fileInfo ? (
          <>
            <Typography><strong>{t('fi_name')}:</strong> {fileInfo.name}</Typography>
            <Typography><strong>{t('fi_size')}:</strong> {fileInfo.size} bytes</Typography>
            <Typography><strong>{t('fi_type')}:</strong> {fileInfo.type}</Typography>
            <Typography><strong>{t('fi_last_modified')}:</strong> {fileInfo.lastModified.toLocaleString()}</Typography>

            <Typography variant="h6" sx={{ mt: 2 }}>{t('fi_hashes')}</Typography>
            <Typography><strong>SHA-256:</strong> {fileInfo.hashes.sha256}</Typography>
            <Typography><strong>SHA-1:</strong> {fileInfo.hashes.sha1}</Typography>
            <Typography><strong>MD5:</strong> {fileInfo.hashes.md5}</Typography>
          </>
        ) : (
          <Typography>No file selected.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FileInfoDialog;
