import { ethers } from 'ethers';
import { getDb } from './_get-db-client';

export default async function handler(req, res) {
    const { address } = req.query;

    const db = await getDb();

    const followers = await db.collection('follows').aggregate([
        { $match: { address } },
        { $lookup: {
                from: 'profile-0',
                localField: 'follows',
                foreignField: 'address',
                as: 'profile'
            }
        }
    ]).toArray();

    res.send(followers);
}
