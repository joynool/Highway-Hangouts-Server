const express = require('express');
const app = express();
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 5000;

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qcqim.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });





async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}








async function run() {
    try {
        await client.connect();
        const database = client.db('highwayHangouts');


        const usersCollection = database.collection('users');
        const chefsCollection = database.collection('chefs');
        const breakfastCollection = database.collection('allbreakfast');
        const allLunchCollection = database.collection('AllLunch');
        const allDinnerCollection = database.collection('allDinner');
        const bookingCollection = database.collection("booking");
        const recipesCollection = database.collection("recipes");
        // const bookingMenuCollection = database.collection("menuAll");
        const reviewCollection = database.collection("review");
        const bookingCollection = database.collection("booking");
        const breakfastCollection = database.collection('breakfast');
        const lunchCollection = database.collection('lunch');
        const dinnerCollection = database.collection('dinner');


        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }
        });



        // Get all breakfast menu item 

        app.get('/allbreakfast', async (req, res) => {
            const query = {};
            const cursor = breakfastCollection.find(query);
            const breakfast = await cursor.toArray();
            res.json(breakfast);
        });

        // Get all lunch menu item 

        app.get('/allLunch', async (req, res) => {
            const query = {};
            const cursor = lunchCollection.find(query);
            const lunch = await cursor.toArray();
            res.json(lunch);
        });

        // Get all dinner menu item 

        app.get('/allDinner', async (req, res) => {
            const query = {};
            const cursor = dinnerCollection.find(query);
            const dinner = await cursor.toArray();
            res.json(dinner);
        });







        // Get all chefs
        app.get("/allChefs", async (req, res) => {
            const result = await chefsCollection.find({}).toArray();
            res.send(result);
        });







        // Add new recipe to database

        app.post("/addRecipes", async (req, res) => {
            console.log(req.body);
            const result = await recipesCollection.insertOne(req.body);
            res.send(result);
        });

        // Get all recipes
        app.get("/allRecipes", async (req, res) => {
            const result = await recipesCollection.find({}).toArray();
            res.send(result);
        });


        // Delete recipe from database 

        app.delete("/deleteRecipe/:id", async (req, res) => {
            console.log(req.params.id);

            const result = await recipesCollection
                .deleteOne({ _id: ObjectId(req.params.id) });

            res.send(result);

        });


        // Get all recipes by email query from database 

        app.get("/myRecipes/:email", async (req, res) => {
            console.log(req.params);


            const result = await recipesCollection
                .find({ email: req.params.email })
                .toArray();
            // console.log(result);
            res.send(result);

        });



        // Get all bookings from database  

        app.get('/booking', async (req, res) => {
            const cursor = bookingCollection.find({});
            const booking = await cursor.toArray();
            res.send(booking);
        });

        // Add new bookings 

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.json(result);
        });


        // Get my bookings through email 

        app.get('/booking/:email', async (req, res) => {
            const email = req.params.email;
            const query = { booking_email: { $eq: email } };
            const cursor = bookingCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });


        // Updating booking status 

        app.put('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const updateStatus = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updateStatus.status
                }
            };
            const result = await bookingCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });


        // Delete Bookings 

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.json(result);
        });




    }


    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Highway Hangouts!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})