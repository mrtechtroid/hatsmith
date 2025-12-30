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
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

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