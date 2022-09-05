import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../contexts/app-context";
import { WalletContext } from "../../../contexts/wallet-context";
import {
    Grid,
    Card,
    CardHeader,
    CardContent,
    Typography,
    styled,
    Fade,
    CircularProgress,
    Box,
    Stack,
    Button,
    Modal,
} from "@mui/material";
import ChevronRightIcon from "../../icons/ChevronRightIcon";
import { useRouter } from "next/router";
// import moment from "moment";
import PoapCard from "./poap-card";
import sleep from "sleep-promise";

const CardContentWrapper = styled(CardContent)(
    () => `
        position: relative;
  `
);

const Poaps = (props) => {
    const [loading, setLoading] = useState(true);
    const [poaps, setPoaps] = useState([]);
    const [open, setOpen] = useState(false);
    const [randomPoap, setRandomPoap] = useState([]);

    const { address } = props.account;

    useEffect(() => {
        // do some
        setLoading(true);
        const url = `https://frontend.poap.tech/actions/scan/${account.address}`;
        fetch(url)
            .then(async (response) => {
                if (response.status === 200) {
                    const result = await response.json();
                    const clones = [];
                    for (let i = 0; i < 60; i++) {
                        clones.push(...result);
                    }
                    setPoaps(clones);
                    // setPoaps(result);
                }
            })
            .catch((err) => {
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            });
            // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    let intervalId;
    useEffect(() => {
        if (poaps.length > 9) {
            showRandomPoap();
            // eslint-disable-next-line react-hooks/exhaustive-deps
            intervalId = setInterval(setRandomPoap, 7000);
        }

        return () => clearInterval(intervalId);
    }, [randomPoap]);

    const showRandomPoap = async () => {
        if (poaps.length > 9) {
            await sleep(500);
            const randomIndex = Math.floor(Math.random() * poaps.length);
            setRandomPoap(poaps[randomIndex]);
        }
    };

    const wallet = useContext(WalletContext);
    const app = useContext(AppContext);
    // const router = useRouter();

    const { account } = props;
    // const myAccount = wallet.address === account.address;

    return (
        <>
            <Fade in={true} timeout={1000}>
                <Card
                    sx={{
                        marginX: { xs: "-16px", md: "0px" },
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        marginTop: "30px",
                        backgroundColor: {
                            xs: app.mode === "dark" ? "#0F151C" : "#FFFFFF",
                            md: app.mode === "dark" ? "#111921" : "#F5F5F5",
                        },
                    }}
                >
                    <CardHeader
                        sx={{
                            alignItems: "flex-start",
                            paddingBottom: "4px",
                        }}
                        title={
                            <Stack
                                direction='row'
                                justifyContent='space-between'
                                paddingTop={"14px"}
                                paddingX={"14px"}
                            >
                                <Typography variant='mobileh1'>
                                    POAPs
                                </Typography>
                                <Button
                                    onClick={() => setOpen(true)}
                                    color={
                                        app.mode === "dark"
                                            ? "primary"
                                            : "secondary"
                                    }
                                    endIcon={
                                        <ChevronRightIcon
                                            color={
                                                app.mode === "dark"
                                                    ? "primary"
                                                    : "secondary"
                                            }
                                        />
                                    }
                                >
                                    View All{" "}
                                </Button>
                                <Modal
                                    open={open}
                                    onClose={() => setOpen(false)}
                                >
                                    <Box
                                        sx={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            margin: "25px",
                                            padding: "30px",
                                            overflow: "hidden",
                                            overflowY: "scroll",
                                            backgroundColor: {
                                                xs:
                                                    app.mode === "dark"
                                                        ? "#0F151C"
                                                        : "#FFFFFF",
                                                md:
                                                    app.mode === "dark"
                                                        ? "#111921"
                                                        : "#F5F5F5",
                                            },
                                        }}
                                    >
                                        <Typography
                                            marginBottom={3}
                                            align='center'
                                            variant='h1'
                                        >
                                            All POAPs
                                        </Typography>
                                        <Grid
                                            container
                                            columnSpacing={3}
                                            rowSpacing={3}
                                        >
                                            {!loading &&
                                                poaps.map((p) => {
                                                    return (
                                                        <Grid
                                                            item
                                                            key={p.tokenId}
                                                            xs={12}
                                                            md={4}
                                                        >
                                                            <PoapCard
                                                                poap={p}
                                                            />
                                                        </Grid>
                                                    );
                                                })}
                                        </Grid>
                                    </Box>
                                </Modal>
                            </Stack>
                        }
                    />
                    <CardContentWrapper>
                        {loading && (
                            <Typography variant='h3'>
                                <CircularProgress size='2rem' />
                            </Typography>
                        )}

                        <Grid
                            container
                            paddingX={{ xs: "0px", md: "14px" }}
                            columnSpacing={3}
                            rowSpacing={3}
                        >
                            {!loading &&
                                poaps.slice(0, 9).map((p) => {
                                    return (
                                        <Fade in={randomPoap} timeout={500} key={p.tokenId}>
                                            <Grid
                                                item
                                                key={p.tokenId}
                                                xs={12}
                                                md={4}
                                            >
                                                <PoapCard poap={p} />
                                            </Grid>
                                        </Fade>
                                    );
                                })}
                        </Grid>
                    </CardContentWrapper>
                </Card>
            </Fade>
        </>
    );
};

export default Poaps;
