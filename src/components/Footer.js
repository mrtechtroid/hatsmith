/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import Container from "@mui/material/Container";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import Link from "@mui/material/Link";
import { Chip, Avatar, Hidden } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { IconButton, Tooltip, TextField } from "@mui/material";
import { Alert } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import { getTranslations as t } from "../../locales";
let QRCode = require("qrcode.react");

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: "auto",
  },

  footer: {
    textAlign: "center",
    color: theme.palette.custom.diamondBlack.main,
    padding: theme.spacing(3, 2),
  },

  topScrollPaper: {
    alignItems: "start",
    marginTop: "10vh",
  },
  topPaperScrollBody: {
    verticalAlign: "middle",
  },

  chip: {
    marginTop: 5,
    border: "none",
    borderRadius: 8,
    textTransform: "none",
    boxShadow: "none",
    color: theme.palette.custom.diamondBlack.main,
    backgroundColor: theme.palette.custom.alto.light,
    "&:hover": {
      backgroundColor: theme.palette.custom.alto.main,
    },
    "&:focus": {
      backgroundColor: theme.palette.custom.alto.main,
      boxShadow: "none",
    },
    transition: "background-color 0.2s ease-out",
    transition: "color .01s",
  },

  monIcon: {
    color: theme.palette.custom.mountainMist.main,
  },

  qr: {
    display: "flex",
    flexDirection: "column",
    margin: "auto",
    width: "fit-content",
    marginBottom: 20,
  },
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`donation-tabpanel-${index}`}
      aria-labelledby={`donation-tab-${index}`}
      {...other}
    >
      {children}
    </div>
  );
};

export default function Footer() {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [currAvatar, setCurrAvatar] = useState("xmr");
  const [donateDialog, setDonateDialog] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const cryptoAddrs = [
    {
      type: "monero",
      alt: "xmr",
      addr: "84zQq4Xt7sq8cmGryuvWsXFMDvBvHjWjnMQXZWQQRXjB1TgoZWS9zBdNcYL7CRbQBqcDdxr4RtcvCgApmQcU6SemVXd7RuG",
    },
    {
      type: "bitcoin",
      alt: "btc",
      addr: "bc1qlfnq8nu2k84h3jth7a27khaq0p2l2gvtyl2dv6",
    },
    {
      type: "ethereum",
      alt: "eth",
      addr: "0xF6F204B044CC73Fa90d7A7e4C5EC2947b83b917e",
    },
  ];

  const handleSnackClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackOpen(false);
    handleSnackOpen();
  };

  const handleSnackOpen = () => {
    setTimeout(function () {
      setSnackOpen(true);
    }, 60000);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClickOpen = () => {
    setDonateDialog(true);
  };

  const handleClose = () => {
    setDonateDialog(false);
  };

  useEffect(() => {
    handleSnackOpen();

    setInterval(() => {
      setCurrAvatar(
        cryptoAddrs[Math.floor(Math.random() * cryptoAddrs.length)].alt
      );
    }, 10000);
  }, []);

  return (
    <div className={classes.root}>
      <footer className={classes.footer}>
        <Container maxWidth="sm">
          <Typography variant="body1">
            Maintained by {" "}
            <Link
              href="https://github.com/mrtechtroid"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"mrtechtroid"}
            </Link>
          </Typography>
          <Typography variant="body1">
            Hatsmith is a fork of{" "}
            <Link
              href="https://github.com/sh-dv/hat.sh"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"hat.sh"}
            </Link>
            {" "}by {" "}
            <Link
              href="https://github.com/sh-dv"
              target="_blank"
              rel="noopener"
              color="inherit"
            >
              {"sh-dv"}
            </Link>
          </Typography>
          {/* <Chip
            size="small"
            className={classes.chip}
            avatar={
              <Avatar src={`/assets/icons/${currAvatar}-logo_new.png`}></Avatar>
            }
            label="Donations Accepted"
            clickable
            onClick={() => handleClickOpen()}
            onDelete={() => handleClickOpen()}
            deleteIcon={<MonetizationOnIcon className={classes.monIcon} />}
          />
          <Dialog
            scroll="body"
            maxWidth="sm"
            fullWidth
            open={donateDialog}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            PaperProps={{
              elevation: 0,
            }}
            classes={{
              scrollPaper: classes.topScrollPaper,
              paperScrollBody: classes.topPaperScrollBody,
            }}
          >
            <DialogTitle>{"Donations"}</DialogTitle>

            <DialogContent>
              <Hidden xsDown>
                <DialogContentText style={{ textAlign: "center" }}>
                  Hat.sh is an open-source application. The project is
                  maintained in my free time. Donations of any size are
                  appreciated.
                </DialogContentText>
              </Hidden>

              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                style={{ marginBottom: 15 }}
                centered
              >
                {cryptoAddrs.map((res, index) => (
                  <Tab label={res.type} key={index} />
                ))}
              </Tabs>

              {cryptoAddrs.map((res, index) => (
                <TabPanel value={tabValue} index={index} key={index}>
                  <div className={classes.qr}>
                    <QRCode
                      style={{
                        borderRadius: 8,
                        margin: 10,
                        boxShadow: "0px 0px 35px 2px rgba(0,0,0,0.2)",
                      }}
                      value={`${res.type}:${res.addr}`}
                      size={200}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"M"}
                      renderAs={"canvas"}
                      includeMargin={true}
                      imageSettings={{
                        src: `/assets/icons/${res.alt}-logo_new.png`,
                        x: null,
                        y: null,
                        height: 40,
                        width: 40,
                        excavate: false,
                      }}
                    />
                  </div>
                  <TextField
                    style={{ marginBottom: 15 }}
                    defaultValue={res.addr}
                    label={res.type}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <>
                          <Tooltip title="Copy address" placement="left">
                            <IconButton
                              onClick={() => {
                                navigator.clipboard.writeText(res.addr);
                              }}
                            >
                              <FileCopyIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      ),
                    }}
                    variant="outlined"
                    fullWidth
                  />
                </TabPanel>
              ))}
            </DialogContent>
            <DialogActions>
              <Button
                style={{ marginBottom: 1 }}
                href="https://ko-fi.com/shdvapps"
                target="_blank"
              >
                <img
                  src="/assets/icons/ko-fi.png"
                  width="200"
                  alt="open collective"
                ></img>
              </Button>
              <div style={{ flex: "1 0 0" }} />
              <Button onClick={handleClose} color="primary">
                {t("close")}
              </Button>
            </DialogActions>
          </Dialog> */}
        </Container>
      </footer>
      {/* <Hidden xsDown>
        <Snackbar
          style={{ zIndex: 1 }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          open={snackOpen}
          autoHideDuration={10000}
          onClose={handleSnackClose}
        >
          <Alert
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={handleClickOpen}>
                <svg
                  enableBackground="new 0 0 24 24"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <g>
                    <rect fill="none" height="24" width="24" />
                  </g>
                  <g>
                    <g>
                      <rect fill="#427aa6" height="11" width="4" x="1" y="11" />
                      <path
                        fill="#427aa6"
                        d="M16,3.25C16.65,2.49,17.66,2,18.7,2C20.55,2,22,3.45,22,5.3c0,2.27-2.91,4.9-6,7.7c-3.09-2.81-6-5.44-6-7.7 C10,3.45,11.45,2,13.3,2C14.34,2,15.35,2.49,16,3.25z"
                      />
                      <path
                        fill="#427aa6"
                        d="M20,17h-7l-2.09-0.73l0.33-0.94L13,16h2.82c0.65,0,1.18-0.53,1.18-1.18v0c0-0.49-0.31-0.93-0.77-1.11L8.97,11H7v9.02 L14,22l8.01-3v0C22,17.9,21.11,17,20,17z"
                      />
                    </g>
                  </g>
                </svg>
              </Button>
            }
          >
            {t("donation_message")}
          </Alert>
        </Snackbar>
      </Hidden> */}
    </div>
  );
}
