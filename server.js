const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// আপনার মঙ্গোডিবি লিংক
const MONGO_URI = "mongodb+srv://tmtohin177:superace123@cluster0.nsyah8t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

app.use(cors());
app.use(bodyParser.json());

// ==============================================
// 🔥 পাথ ফিক্স (Path Fix)
// ==============================================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
// ==============================================

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
    totalReferralBonus: { type: Number, default: 0.00 } 
});
const User = mongoose.model('User', UserSchema);

const TransactionSchema = new mongoose.Schema({
    type: String, amount: Number, method: String, phone: String, trx: String, username: String,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now },
    seenByAdmin: { type: Boolean, default: false }
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

const SettingsSchema = new mongoose.Schema({
    id: { type: String, default: 'global' },
    notice: { type: String, default: 'Welcome to SuperAce! Good Luck!' }
});
const Settings = mongoose.model('Settings', SettingsSchema);

// Admin Init
async function initAdmin() {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt);
        await new User({ username: 'admin', password: hashedPassword, mobile: '01000000000', balance: 999999999, isAdmin: true, ownReferralCode: 'admin01' }).save();
        console.log("🔥 Admin Account Ready!");
    }
    const setExists = await Settings.findOne({ id: 'global' });
    if (!setExists) await new Settings({ id: 'global' }).save();
}
initAdmin();

// --- ROUTES ---
app.get('/api/settings', async (req, res) => {
    try { const s = await Settings.findOne({ id: 'global' }); res.json(s); } catch { res.json({ notice: '' }); }
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
        if (exists) return res.json({ success: false, message: 'Username or Mobile already exists!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const randomNum = Math.floor(Math.random() * 90 + 10);
        const myCode = `${username}${randomNum}`;

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
        res.json({ success: true, message: 'Registration Successful! Login Now.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Error creating account' }); }
});

app.get('/api/user-data', async (req, res) => {
    const { username } = req.query;
    try {
        const user = await User.findOne({ username });
        if (user) res.json({ success: true, balance: user.balance, isBanned: user.isBanned, myCode: user.ownReferralCode });
        else res.json({ success: false });
    } catch (err) { res.json({ success: false }); }
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
                const newTrx = new Transaction(trxData);
                await newTrx.save();
                res.json({ success: true, message: 'Withdraw Request Submitted', newBalance: user.balance });
            } else {
                res.json({ success: false, message: 'Insufficient Balance' });
            }
        } else {
            const newTrx = new Transaction(trxData);
            await newTrx.save();
            res.json({ success: true, message: 'Deposit Request Submitted' });
        }
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/api/update-balance', async (req, res) => {
    const { username, amount } = req.body;
    try {
        const user = await User.findOne({ username });
        if (user) {
            user.balance += amount;
            user.balance = parseFloat(user.balance.toFixed(2));
            await user.save();
            res.json({ success: true, newBalance: user.balance });
        } else res.json({ success: false });
    } catch (err) { res.status(500).json({ success: false }); }
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
                        const referrer = await User.findOne({ username: user.referredBy });
                        if (referrer) {
                            referrer.balance += amount * 0.10;
                            referrer.totalReferralBonus += amount * 0.10;
                            await referrer.save();
                        }
                    }
                }
                if (action === 'reject' && type === 'Withdraw') user.balance += amount;
                user.balance = parseFloat(user.balance.toFixed(2));
                await user.save();
            }
            res.json({ success: true });
        } else res.json({ success: false });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/transactions', async (req, res) => { try { const t = await Transaction.find().sort({ date: -1 }).limit(100); res.json(t); } catch { res.json([]); } });
app.get('/api/admin/users', async (req, res) => { try { const u = await User.find({}, 'username mobile balance isBanned ownReferralCode').sort({ _id: -1 }); res.json(u); } catch { res.json([]); } });
app.post('/api/admin/ban-user', async (req, res) => { try { await User.updateOne({ username: req.body.username }, { isBanned: req.body.banStatus }); res.json({ success: true }); } catch { res.json({ success: false }); } });
app.get('/api/history', async (req, res) => { try { const h = await Transaction.find({ username: req.query.username }).sort({ date: -1 }).limit(20); res.json(h); } catch { res.json([]); } });
app.post('/api/admin/update-notice', async (req, res) => { await Settings.updateOne({ id: 'global' }, { notice: req.body.notice }); res.json({ success: true }); });

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.listen(PORT, () => { console.log(`Server running at http://localhost:${PORT}`); });