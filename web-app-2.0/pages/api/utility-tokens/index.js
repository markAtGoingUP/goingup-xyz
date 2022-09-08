import { ethers } from 'ethers';
import artifact from '../../../artifacts/GoingUpUtilityTokens.json';

export const contractAddress = '0x10D7B3aFA213D93a922a062fb91E8EcbD4A703d2';
export const abi = artifact.abi;
export const provider = new ethers.providers.AlchemyProvider(137, process.env.ALCHEMY_POLYGON_MAINNET);
export const contract = new ethers.Contract(contractAddress, abi, provider);

const getToken = async (tokenId) => {
    const token = await contract.tokenSettings(tokenId);
    return {
        id: tokenId,
        description: token.description,
        metadataURI: token.metadataURI,
        category: token.category,
        tier: token.tier,
        price: token.price,
    };
};

const tokens = [
    {
        categoryId: 1,
        categoryName: 'GoingUP Appreciation Tokens',
        tokenIds: [1, 2, 3, 4],
        tokenSettings: []
    }
];

export default async function handler(req, res) {
    for (const token of tokens) {
        for (const tokenId of token.tokenIds) {
            token.tokenSettings.push(await getToken(tokenId));
        }
    }

    res.send(tokens);
}
