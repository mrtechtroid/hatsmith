import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { makeStyles } from "@mui/styles";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { getTranslations as t } from "../locales";

const useStyles = makeStyles((theme) => ({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    textAlign: "center",
  },
  progress: {
    marginBottom: theme.spacing(2),
  },
  message: {
    marginBottom: theme.spacing(2),
  },
}));

export default function FilePage() {
  const classes = useStyles();
  const router = useRouter();
  const [error, setError] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Set a timeout to show error message if download doesn't start
    const timeout = setTimeout(() => {
      setTimeoutReached(true);
      setError(true);
    }, 10000); // 10 seconds timeout

    // Check if service worker is available
    if (!("serviceWorker" in navigator)) {
      setError(true);
      clearTimeout(timeout);
      return;
    }

    // Listen for service worker messages
    const handleMessage = (event) => {
      if (event.data && event.data.reply === "downloadStarted") {
        clearTimeout(timeout);
      }
      
      // Handle subsequent file downloads for multi-file encryption
      if (event.data && event.data.reply === "filePreparedEnc") {
        console.log('[File Page] Next file prepared, triggering download');
        setTimeout(triggerDownload, 500);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    // Trigger the download by making a fetch request to /download-file
    const triggerDownload = async () => {
      try {
        console.log('[File Page] Triggering download fetch request to /api/download-file');
        const response = await fetch('/download-file');
        
        if (response.ok) {
          // Create a blob from the response
          const blob = await response.blob();
          
          // Get the filename from Content-Disposition header
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename = 'encrypted_file.enc';
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }
          
          // Create download link and trigger download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          console.log('[File Page] Download triggered successfully');
          
          // After successful download, check if there are more files to download
          // by listening for service worker messages about next file preparation
        } else {
          console.error('[File Page] Download fetch failed:', response.status, response.statusText);
          // If the response is empty or has no content, it might be a service worker issue
if (response.status === 200 && (!response.headers.get('content-length') || response.headers.get('content-length') === '0')) {
  console.error('[File Page] Service worker may not have intercepted the request properly');
}
          setTimeout(() => setError(true), 1000); // Small delay to allow for potential retry
        }
      } catch (error) {
        console.error('[File Page] Download error:', error.message);
        console.error('[File Page] Full error:', error);
        setTimeout(() => setError(true), 1000); // Small delay to allow for potential retry
      }
    };

    // Small delay to ensure service worker is ready
    setTimeout(triggerDownload, 500);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleGoBack = () => {
    router.push("/");
  };

  if (error) {
    return (
      <Container className={classes.container}>
        <Alert severity="error" className={classes.message}>
          <Typography variant="h6">
            {timeoutReached 
              ? t("download_timeout_error") || "Download timeout. Please try again."
              : t("download_error") || "Download failed. Please try again."
            }
          </Typography>
        </Alert>
        <Typography 
          variant="body2" 
          color="primary" 
          style={{ cursor: "pointer", textDecoration: "underline" }}
          onClick={handleGoBack}
        >
          {t("go_back") || "Go back"}
        </Typography>
      </Container>
    );
  }

  return (
    <Container className={classes.container}>
      <CircularProgress size={60} className={classes.progress} />
      <Typography variant="h6" className={classes.message}>
        {t("preparing_download") || "Preparing your download..."}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {t("page_close_alert") || "Don't close the page while files are downloading!"}
      </Typography>
    </Container>
  );
}