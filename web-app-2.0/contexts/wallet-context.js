import { ReactNode, useState, createContext, useEffect, useRef, useContext } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import Web3Modal from 'web3modal';
import { useSnackbar } from 'notistack';
import WalletConnectProvider from '@walletconnect/web3-provider';
import CoinbaseWalletSDK from '@coinbase/wallet-sdk';
import { AppContext } from './app-context';
import { Backdrop, Button, Paper, Stack, Typography } from '@mui/material';
import { deleteCookie, getCookie, hasCookie } from 'cookies-next';
import { useModal } from 'connectkit';
import { useAccount, useDisconnect, useNetwork, useProvider, useSigner } from 'wagmi';

export const WalletContext = createContext({});

const walletTypes = {
    metamask: { display: 'MetaMask' },
    walletconnect: { display: 'WalletConnect' },
    flint: { display: 'Flint' },
};

const networks = {
    1: {
        name: 'Ethereum Mainnet',
    },
    3: {
        name: 'Ropsten Testnet',
    },
    4: {
        name: 'Rinkeby Testnet',
    },
    5: {
        name: 'Goerli Testnet',
    },
    42: {
        name: 'Kovan Testnet',
    },
    137: {
        name: 'Polygon Mainnet',
        group: 'polygon',
        networkParams: {
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
            },
            rpcUrls: ['https://polygon-rpc.com/'],
            blockExplorerUrls: ['https://polygonscan.com/'],
        },
    },
    80001: {
        name: 'Polygon Mumbai Testnet',
        group: 'polygon',
        networkParams: {
            chainId: '0x13881',
            chainName: 'Polygon Testnet',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18,
            },
            rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
            blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
        },
    },
    'CARDANO-0': {
        name: 'Cardano Testnet',
    },
    'CARDANO-1': {
        name: 'Cardano Mainnet',
    },
};

let web3Modal;
const providerOptions = {
    walletconnect: {
        package: WalletConnectProvider,
        options: {
            infuraId: '86d5aa67154b4d1283f804fe39fcb07c',
        },
    },
    coinbasewallet: {
        package: CoinbaseWalletSDK,
        options: {
            appName: 'GoingUP',
            infuraId: '86d5aa67154b4d1283f804fe39fcb07c',
            chainId: 1,
        },
        theme: 'light',
    },
};

const web3ModalOptions = {
    // network: 'mainnet',
    cacheProvider: true,
    providerOptions,
    theme: 'light',
};

export function WalletProvider({ children }) {
    const router = useRouter();
    const wselRef = useRef(null);

    const app = useContext(AppContext);

    const [address, setAddress] = useState(null);
    const [network, setNetwork] = useState(null);
    const [chain, setChain] = useState(null);
    const [ethersProvider, setEthersProvider] = useState(null);
    const [ethersSigner, setEthersSigner] = useState(null);
    const [walletType, setWalletType] = useState(null);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const { setOpen: setConnectKitOpen } = useModal();

    useEffect(() => {
        if (address) {
            try {
                if (Notification.permission === 'denied') {
                    if (localStorage.getItem('notifs-denied-forever') === 'true') return;

                    enqueueSnackbar('Please enable notifications in your browser settings', {
                        variant: 'warning',
                        persist: true,
                        action: (key) => (
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" color="primary" onClick={() => closeSnackbar(key)}>
                                    Later
                                </Button>

                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => {
                                        closeSnackbar(key);
                                        localStorage.setItem('notifs-denied-forever', true);
                                        enqueueSnackbar('Notifications disabled for this device', { variant: 'warning' });
                                    }}
                                >
                                    Never
                                </Button>
                            </Stack>
                        ),
                    });
                }

                if (Notification.permission === 'granted') {
                    // check for existing subscription
                    if (localStorage.getItem('psn-subscription')) {
                        const subscription = JSON.parse(localStorage.getItem('psn-subscription'));
                        if (subscription) postPsnSubscription(subscription);
                        else {
                            app.subscribeUserToPush().then((subscription) => {
                                postPsnSubscription(subscription);
                            });
                        }
                    } else {
                        app.subscribeUserToPush().then((subscription) => {
                            postPsnSubscription(subscription);
                        });
                    }
                }

                if (Notification.permission === 'default') {
                    if (localStorage.getItem('notifs-denied-forever') === 'true') return;
                    enqueueSnackbar('Do you want to receive notifications from GoingUP?', {
                        variant: 'info',
                        persist: true,
                        action: (key) => (
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" color="primary" onClick={() => askNotifsConsent(key)}>
                                    Yes
                                </Button>

                                <Button variant="contained" color="secondary" onClick={() => closeSnackbar(key)}>
                                    No
                                </Button>

                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => {
                                        closeSnackbar(key);
                                        localStorage.setItem('notifs-denied-forever', true);
                                        enqueueSnackbar('Notifications disabled for this device', { variant: 'warning' });
                                    }}
                                >
                                    Never
                                </Button>
                            </Stack>
                        ),
                    });
                }
            } catch (err) {
                console.log(err);
            }
        }
    }, [address]);

    const askNotifsConsent = async (snackbarKey) => {
        closeSnackbar(snackbarKey);
        const key = enqueueSnackbar('Please approve notifications in the prompt which should be near the address bar', {
            variant: 'info',
            persist: true,
        });

        try {
            const result = await Notification.requestPermission();

            if (result === 'granted') {
                const subscription = await app.subscribeUserToPush();
                postPsnSubscription(subscription, true);
            } else {
                enqueueSnackbar('You did not allow notifications', { variant: 'warning' });
            }
        } catch (e) {
            console.log(e);
        } finally {
            closeSnackbar(key);
        }
    };

    const postPsnSubscription = async (subscription, showNotification = false) => {
        if (subscription) {
            localStorage.setItem('psn-subscription', JSON.stringify(subscription));
            await fetch('/api/psn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription,
                    address,
                }),
            });
            if (showNotification) enqueueSnackbar('Notifications enabled', { variant: 'success' });
        }
    };

    const connect = async () => {
        let cache;

        try {
            cache = JSON.parse(localStorage.getItem('wallet-context-cache'));
        } catch (err) {}

        if (cache) {
            if (!address) {
                if (cache.blockchain === 'evm') {
                    connectEthereum();
                } else if (cache.blockchain === 'cardano') {
                    connectCardano();
                }
            }
        } else {
            if (!address) wselRef.current.showModal();
        }
    };

    const disconnect = async () => {
        if (chain === 'Ethereum') {
            disconnectEthereum();
        } else if (chain === 'Cardano') {
            disconnectCardano();
        }

        localStorage.removeItem('wallet-context-cache');
    };

    const checkForGoingUpAccount = async (address) => {
        const response = await fetch(`/api/has-account?address=${address}`);
        if (response.status === 200) {
            const result = await response.json();

            if (
                result.hasAccount &&
                router.pathname?.toLowerCase() === '/create-account' &&
                router.pathname?.toLowerCase() !== '/profile/[address]'
            ) {
                router.push(`/profile/${address}`);
            }

            if (
                !result.hasAccount &&
                router.pathname !== '/create-account' &&
                router.pathname?.toLowerCase() !== '/gitcoin-donors/claim-appreciation-token' &&
                router.pathname?.toLowerCase() !== '/profile/[address]'
            ) {
                router.push('/create-account');
            }
        } else {
            throw `${response.status}: ${(await response).text()}`;
        }
    };

    const signInEthereum = async (address, signer) => {
        if (hasCookie('auth-token')) return;

        if (!address) throw 'No address found';
        if (!ethersSigner) throw 'No signer found';

        // sign a message with wallet
        const message = `I am signing this message to prove that I own the address ${address}. This message will be used to sign in to app.goingup.xyz and receive an authentication token cookie.`;

        const signature = await ethersSigner.signMessage(message);

        // send signature to server
        const response = await fetch(`/api/accounts/${address}/sign-in`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                signature,
            }),
        });

        if (response.ok) {
            const result = await response.json();
        }
    };

    const { address: evmAddress, isConnected: evmIsConnected, isConnecting: evmIsConnecting } = useAccount();
    const { chain: evmChain } = useNetwork();
    const evmProvider = useProvider();
    const { data: evmSigner } = useSigner();
    const connectEthereum = async () => {
        disconnectEthereum();
        setConnectKitOpen(true);
    };

    useEffect(() => {
        if (evmIsConnected && !evmIsConnecting) {
            setChain(`Ethereum`);
            setNetwork(evmChain);
            setWalletType('connectkit');
            setEthersProvider(evmProvider);
            setEthersSigner(evmSigner);
            setAddress(evmAddress);

            enqueueSnackbar('Wallet connected', { variant: 'success' });
            checkForGoingUpAccount(evmAddress);
            localStorage.setItem(
                'wallet-context-cache',
                JSON.stringify({
                    blockchain: 'evm',
                    // type: walletType,
                })
            );

            signInEthereum(evmAddress, evmSigner);
        }

        if (!evmIsConnected && !evmIsConnecting) {
            disconnectEthereum();
        }
    }, [evmAddress, evmIsConnected, evmIsConnecting, evmProvider, evmSigner, evmChain]);

    const { disconnect: evmDisconnect } = useDisconnect();
    const disconnectEthereum = async () => {
        evmDisconnect();
        clearState();
    };

    const clearState = () => {
        deleteCookie('auth-token');
        localStorage.removeItem('wallet-context-cache');
        setChain(null);
        setAddress(null);
        setNetwork(null);
        setEthersProvider(null);
    };

    const connectCardano = async () => {
        // // @ts-ignore
        // const flint = window.cardano?.flint;
        // if (!flint) {
        //     enqueueSnackbar(
        //         'You do not have Flint wallet. Please install Flint wallet and try again.',
        //         { variant: 'error' }
        //     );
        //     return;
        // }
        // const fw = await flint.enable();
        // const rawAddress = (await fw.getUsedAddresses())[0];
        // const computedAddress = Address.from_bytes(
        //     Buffer.from(rawAddress, 'hex')
        // ).to_bech32();
        // console.log(computedAddress);
        // setChain(`Cardano`);
        // setNetwork(`CARDANO-${await fw.getNetworkId()}`);
        // setWalletType('flint');
        // setEthersProvider(null);
        // setEthersSigner(null);
        // setAddress(computedAddress);
        // // const token = await CardanoWeb3.sign(msg => flint.signData(address, new Buffer('myString').toString('hex');))
        // checkForGoingUpAccount(address);
        // localStorage.setItem('wallet-context-cache', JSON.stringify({
        //     blockchain: 'cardano',
        //     type: 'flint'
        // }));
    };

    const disconnectCardano = async () => {
        clearState();
    };

    const signMessage = async (message) => {
        if (chain === 'Ethereum') {
            const authToken = getCookie('auth-token');
            if (authToken) {
                return authToken;
            } else {
                const signature = await ethersSigner.signMessage(message);
                return signature;
            }
        } else if (chain === 'Cardano') {
            //     // @ts-ignore
            //     const cardano = window.cardano;
            //     await cardano.flint.enable();
            //     // getting address from which we will sign message
            //     const address = (await cardano.getUsedAddresses())[0];
            //     // generating a token with 1 day of expiration time
            //     const token = await Web3Token.sign(
            //         (msg) =>
            //             cardano.signData(address, Buffer.from(msg).toString('hex')),
            //         '1d'
            //     );
            //     console.log(token);
            //     return token;
        }
    };

    const utilityToken = {
        chainId: 137,
        chainName: 'Polygon Mainnet',
        address: '0x10D7B3aFA213D93a922a062fb91E8EcbD4A703d2',
        get provider() {
            return new ethers.providers.AlchemyProvider(this.chainId, process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_MAINNET);
        },
    };

    const utilityTokenTestnet = {
        chainId: 80001,
        chainName: 'Polygon Mumbai Testnet',
        address: '0x825D5014239a59d7587b9F53b3186a76BF58aF72',
        get provider() {
            return new ethers.providers.AlchemyProvider(this.chainId, process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_KEY);
        },
    };

    const setWeb3ModalTheme = (theme) => {
        web3ModalOptions.theme = theme;
        web3ModalOptions.providerOptions.coinbasewallet.darkMode = theme === 'dark';
        web3ModalOptions.providerOptions.coinbasewallet.options.darkMode = theme === 'dark';
        web3ModalOptions.providerOptions.coinbasewallet.theme = theme;
        console.log(web3ModalOptions);
    };

    const mainnetENSProvider = ethers.getDefaultProvider('homestead');

    return (
        <WalletContext.Provider
            value={{
                networks,
                chain,
                connectEthereum,
                disconnectEthereum,
                address,
                network,
                walletType,
                ethersProvider,
                ethersSigner,
                networks,
                walletTypes,
                connect,
                disconnect,
                signMessage,
                utilityToken,
                setWeb3ModalTheme,
                mainnetENSProvider,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}
