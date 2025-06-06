/* eslint-disable @next/next/no-img-element */
import { makeStyles } from "@mui/styles";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getTranslations as t } from "../../locales";

const useStyles = makeStyles((theme) => ({
  heroTitle: {
    color: theme.palette.custom.diamondBlack.main,
    marginTop: 20,
  },
  heroSubTitle: {
    color: theme.palette.custom.diamondBlack.main,
  },
}));

export default function Hero() {
  const classes = useStyles();
  return (
    <Container maxWidth="sm" component="main" className={classes.heroContent}>
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        className={classes.heroTitle}
      >
        {"Hatsmith"}
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        component="p"
        className={classes.heroSubTitle}
      >
        {t('sub_title')}
        <br />
      </Typography>
    </Container>
  );
}
