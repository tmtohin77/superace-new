const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = "mongodb+srv://tmtohin177:superace123@cluster0.nsyah8t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0.00 },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    referredBy: { type: String, default: null }, 
    ownReferralCode: { type: String, unique: true },
    totalReferralBonus: { type: Number, default: 0.00 },
    totalBet: { type: Number, default: 0 },
    totalWin: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

const TransactionSchema = new mongoose.Schema({
    type: String, amount: Number, method: String, phone: String, trx: String, username: String,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now },
    seenByAdmin: { type: Boolean, default: false }
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

const BetHistorySchema = new mongoose.Schema({
    username: { type: String },
    betAmount: { type: Number },
    winAmount: { type: Number },
    result: { type: String },
    date: { type: Date, default: Date.now }
});
const BetHistory = mongoose.model('BetHistory', BetHistorySchema);

const SettingsSchema = new mongoose.Schema({
    id: { type: String, default: 'global' },
    notice: { type: String, default: 'Welcome to SuperAce! Good Luck!' },
    winRate: { type: Number, default: 30 }
});
const Settings = mongoose.model('Settings', SettingsSchema);

async function initAdmin() {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt);
        await new User({ username: 'admin', password: hashedPassword, mobile: '01000000000', balance: 999999999, isAdmin: true, ownReferralCode: 'ADMIN01' }).save();
    }
    const setExists = await Settings.findOne({ id: 'global' });
    if (!setExists) await new Settings({ id: 'global', winRate: 30 }).save();
}
initAdmin();

// --- ROUTES ---
app.get('/api/settings', async (req, res) => {
    try { const s = await Settings.findOne({ id: 'global' }); res.json(s); } catch { res.json({ notice: '', winRate: 30 }); }
});

app.post('/api/admin/update-winrate', async (req, res) => {
    await Settings.updateOne({ id: 'global' }, { winRate: parseInt(req.body.winRate) });
    res.json({ success: true });
});

app.post('/api/admin/update-notice', async (req, res) => { 
    await Settings.updateOne({ id: 'global' }, { notice: req.body.notice }); 
    res.json({ success: true }); 
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ $or: [{ username }, { mobile: username }] });
        if (!user) return res.json({ success: false, message: 'User not found' });
        if (user.isBanned) return res.json({ success: false, message: 'ACCOUNT BANNED!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: 'Invalid Password' });

        const userData = user.toObject();
        delete userData.password;
        res.json({ success: true, user: userData });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/register', async (req, res) => {
    const { mobile, username, password, refCode } = req.body;
    try {
        const exists = await User.findOne({ $or: [{ mobile }, { username }] });
        if (exists) return res.json({ success: false, message: 'User already exists!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        const namePart = username.substring(0, 3).toUpperCase();
        const myCode = `${namePart}${randomStr}`;

        let referrerName = null;
        if (refCode) {
            const referrer = await User.findOne({ ownReferralCode: refCode });
            if (referrer) {
                referrerName = referrer.username;
                referrer.balance += 200;
                referrer.totalReferralBonus += 200;
                await referrer.save();
            }
        }

        const newUser = new User({ 
            username, password: hashedPassword, mobile, balance: 0.00, referredBy: referrerName, ownReferralCode: myCode 
        });
        await newUser.save();
        res.json({ success: true, message: 'Registration Successful!' });
    } catch (err) { res.status(500).json({ success: false, message: 'Error' }); }
});

app.get('/api/user-data', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.query.username });
        if (user) res.json({ success: true, balance: user.balance, isBanned: user.isBanned, myCode: user.ownReferralCode });
        else res.json({ success: false });
    } catch { res.json({ success: false }); }
});

app.get('/api/admin/user-details', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.query.username });
        if (!user) return res.json({ success: false });
        
        const deposits = await Transaction.aggregate([{ $match: { username: user.username, type: 'Deposit', status: 'Success' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
        const withdraws = await Transaction.aggregate([{ $match: { username: user.username, type: 'Withdraw', status: 'Success' } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
        
        res.json({ 
            success: true, 
            user: {
                username: user.username,
                mobile: user.mobile,
                balance: user.balance,
                isBanned: user.isBanned,
                totalDeposit: deposits[0]?.total || 0,
                totalWithdraw: withdraws[0]?.total || 0,
                totalBet: user.totalBet,
                totalWin: user.totalWin,
                ownReferralCode: user.ownReferralCode
            }
        });
    } catch { res.json({ success: false }); }
});

// 🔥 NEW: API for Deposit/Withdraw History
app.get('/api/user-transactions', async (req, res) => {
    try {
        const { username, type } = req.query;
        const query = { username };
        if (type) query.type = type;
        const txs = await Transaction.find(query).sort({ date: -1 }).limit(20);
        res.json(txs);
    } catch { res.json([]); }
});

app.post('/api/transaction', async (req, res) => {
    const trxData = req.body;
    try {
        if (trxData.type === 'Withdraw') {
            const user = await User.findOne({ username: trxData.username });
            if (user && user.balance >= trxData.amount) {
                user.balance -= trxData.amount;
                user.balance = parseFloat(user.balance.toFixed(2));
                await user.save();
                await new Transaction(trxData).save();
                res.json({ success: true, message: 'Withdraw Request Submitted' });
            } else res.json({ success: false, message: 'Insufficient Balance' });
        } else {
            await new Transaction(trxData).save();
            res.json({ success: true, message: 'Deposit Request Submitted' });
        }
    } catch { res.status(500).json({ success: false }); }
});

app.post('/api/update-balance', async (req, res) => {
    const { username, amount } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user) {
            user.balance += amount;
            if(amount < 0) user.totalBet += Math.abs(amount);
            if(amount > 0) user.totalWin += amount;
            
            user.balance = parseFloat(user.balance.toFixed(2));
            await user.save();

            await new BetHistory({
                username,
                betAmount: amount < 0 ? Math.abs(amount) : 0,
                winAmount: amount > 0 ? amount : 0,
                result: amount > 0 ? 'WIN' : 'LOSS'
            }).save();

            res.json({ success: true, newBalance: user.balance });
        } else res.json({ success: false });
    } catch { res.status(500).json({ success: false }); }
});

app.post('/api/admin/action', async (req, res) => {
    const { trxId, action, type, amount, username } = req.body;
    try {
        const trx = await Transaction.findOne({ $or: [{ trx: trxId }, { phone: trxId }], status: 'Pending' });
        if (trx) {
            trx.status = action === 'approve' ? 'Success' : 'Failed';
            trx.seenByAdmin = true;
            await trx.save();
            const user = await User.findOne({ username });
            if (user) {
                if (action === 'approve' && type === 'Deposit') {
                    user.balance += amount;
                    if (user.referredBy) {
                        const ref = await User.findOne({ username: user.referredBy });
                        if(ref) { ref.balance += amount * 0.10; await ref.save(); }
                    }
                }
                if (action === 'reject' && type === 'Withdraw') user.balance += amount;
                user.balance = parseFloat(user.balance.toFixed(2));
                await user.save();
            }
            res.json({ success: true });
        } else res.json({ success: false });
    } catch { res.status(500).json({ success: false }); }
});

app.get('/api/admin/transactions', async (req, res) => { try { const t = await Transaction.find().sort({ date: -1 }).limit(100); res.json(t); } catch { res.json([]); } });
app.get('/api/admin/users', async (req, res) => { try { const u = await User.find({}, 'username mobile balance isBanned').sort({ _id: -1 }); res.json(u); } catch { res.json([]); } });
app.post('/api/admin/ban-user', async (req, res) => { try { await User.updateOne({ username: req.body.username }, { isBanned: req.body.banStatus }); res.json({ success: true }); } catch { res.json({ success: false }); } });
app.get('/api/history', async (req, res) => { 
    try { 
        const h = await BetHistory.find({ username: req.query.username }).sort({ date: -1 }).limit(30); 
        res.json(h); 
    } catch { res.json([]); } 
});

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`); });