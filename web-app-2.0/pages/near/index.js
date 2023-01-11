import Head from 'next/head';
import { Button, Typography } from '@mui/material';
import { AppContext } from '../../contexts/app-context';
import { useState, useEffect } from 'react';
import { Box } from '@mui/system';
import { useRouter } from 'next/router';
import { v4 as uuid } from 'uuid';

//Near imports
import {
    signIn,
    signOut,
    wallet,
    viewFunction,
    callFunction,
    initNear,
} from '../../contexts/near-context';
import CreateAccountForm from '../../components/pages/create-account/create-account-form';

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);
    const router = useRouter();
    const id = uuid();

    useEffect(() => {
        initNear();
        setIsLoading(false);
        if (wallet.getAccountId()) {
            setUser(wallet.getAccountId());
            console.log('user', user);
            console.log('wallet', wallet);
            viewFunction('nft_metadata', { token_id: '1' }).then((result) => {
                console.log('result', result);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet]);

    useEffect(() => {
        if (user) {
            viewFunction('nft_tokens_for_owner', {
                account_id: user,
            }).then((result) => {
                console.log('results', result);
                setTokens(result);
            });
        }
    }, [user]);

    const mintToken = async () => {
        await callFunction(
            'nft_mint',
            {
                token_id: id,
                metadata: {
                    title: 'test title',
                    description: 'test description',
                    media: 'https://media.licdn.com/dms/image/C560BAQGnbrbibTKR6Q/company-logo_200_200/0/1672737295471?e=1680739200&v=beta&t=dhlWalKcErYK8iwwIWGmIr4C1U2SIDT43OCGDMzIn7w',
                },
                receiver_id: user,
            },
            '1', // attached GAS (optional)
            '7730000000000000000000' // attached GAS (optional)
        );
    };

    const sendToken = async () => {
        await callFunction(
            'nft_mint',
            {
                token_id: id,
                metadata: {
                    title: 'Appreciation Token',
                    description: 'Thank you!',
                    media: 'https://media.licdn.com/dms/image/C560BAQGnbrbibTKR6Q/company-logo_200_200/0/1672737295471?e=1680739200&v=beta&t=dhlWalKcErYK8iwwIWGmIr4C1U2SIDT43OCGDMzIn7w',
                },
                receiver_id: prompt('Enter the receiver ID'),
            },
            '1', // attached GAS (optional)
            '7730000000000000000000' // attached GAS (optional)
        );
    };

    const handleTransfer = async (token) => {
        await callFunction(
            'nft_transfer',
            {
                receiver_id: prompt('Enter the receiver ID'),
                token_id: token,
            },
            '0.000000000000000000000001', // attached GAS (optional)
            '0.000000000000000000000001' // attached GAS (optional)
        );
    };

    return isLoading ? (
        <Box className='center-Box'>
            <Typography>loading</Typography>
        </Box>
    ) : (
        <Box>
            <Head>
                <title>GoingUP: Profile(Near)</title>
                <link rel='icon' href='/favicon.ico' />
            </Head>

            <Box className='m-6 border-t-4'>
                {!user ? (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant='h2'>
                            You need a connected wallet with a GoingUP account
                            to access your Profile
                            <Button
                                variant='contained'
                                onClick={() => {
                                    signIn();
                                }}>
                                Connect Wallet
                            </Button>
                        </Typography>
                        <img
                            src='/images/illustrations/connection-lost.svg'
                            alt='connection-lost'
                            style={{ width: '100%', maxWidth: '500px' }}
                        />
                    </Box>
                ) : (
                    <>
                        <Box marginY={2}>
                            <Typography variant='h2' marginY={2}>
                                Welcome, {user}
                            </Typography>
                            <Button
                                variant='outlined'
                                onClick={() => {
                                    router.push(`/near/${user}`);
                                }}>
                                Create Account
                            </Button>
                            <Button
                                variant='outlined'
                                onClick={() => {
                                    mintToken();
                                }}>
                                Mint Token
                            </Button>
                            <Button
                                variant='outlined'
                                onClick={() => {
                                    sendToken();
                                }}>
                                Send Token
                            </Button>
                            <Button
                                variant='contained'
                                onClick={() => {
                                    signOut();
                                    setUser(null);
                                }}>
                                Sign out
                            </Button>
                            <Box>
                                {tokens && (
                                    <Box marginY={2}>
                                        <Typography variant='h1'>
                                            Your NFTs
                                        </Typography>
                                        <Box>
                                            {tokens.map((token) => (
                                                <Box key={token.token_id}>
                                                    <a href='#!'>
                                                        <img
                                                            src={
                                                                token.metadata
                                                                    .media
                                                            }
                                                            alt={
                                                                token.metadata
                                                                    .title
                                                            }
                                                            width='100'
                                                            height='100'
                                                        />
                                                    </a>
                                                    <Box>
                                                        <Typography variant='h2'>
                                                            {
                                                                token.metadata
                                                                    .title
                                                            }
                                                        </Typography>
                                                        <Typography variant='h3'>
                                                            {
                                                                token.metadata
                                                                    .description
                                                            }
                                                        </Typography>
                                                        <Button
                                                            onClick={() => {
                                                                handleTransfer(
                                                                    token.token_id
                                                                );
                                                            }}
                                                            variant='outlined'
                                                            type='Button'>
                                                            Transfer NFT
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
