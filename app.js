// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const joi = require('joi');

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://test:52h4Dve9hKZsNSRy@db-test.ub4mwjn.mongodb.net/keyboard-shortcuts?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error: ' + err);
    process.exit(-1);
});

const _idSchema = new mongoose.Schema(
    {
        application: String,
        os: String,
    },
    { _id: false }
).index(
    {
        '_id.application': 1
    },
    {
        '_id.os': 1
    }
);

const keyboardShortcutSchema = new mongoose.Schema({
    _id: _idSchema,
    shortcutCombination: Object
}).index({
    // from v4.2
    "shortcutCombination.$**": 1
});
const KeyboardShortcut = mongoose.model('KeyboardShortcut', keyboardShortcutSchema);

// Start api routes
// Create new or update an existed shortcut
app.post('/shortcuts', async (req, res) => {
    try {
        const { error, value: validatedData } = joi.object({
            combination: joi.string().lowercase().max(20).regex(/^\S*$/).message('combination not include white space').required(),
            description: joi.string().lowercase().max(1024).required(),
            os: joi.string().lowercase().max(20).required(),
            application: joi.string().max(100).lowercase(),
        }).validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const { combination, description, os, application } = validatedData;
        const result = await KeyboardShortcut.findOneAndUpdate(
            {
                _id: {
                    application,
                    os,
                }
            },
            {
                $set: {
                    [`shortcutCombination.${combination}`]: {
                        combination,
                        description
                    }
                }
            },
            {
                upsert: true,
                new: true
            }
        );
        return res.status(201).json(result);
    } catch(err) {
        return res.status(400).json(err.message);
    }

});

// Lookup shortcuts
// The combination includes special character(+) so to be simple, just use POST instead of GET to avoid encoding URI
app.post('/shortcuts/lookup', async (req, res) => {
    try {
        const { error, value: validatedData } = joi.object({
            limit: joi.number().max(1000).default(20),
            lastCursor: joi.string().optional(),
            os: joi.string().lowercase().max(20).optional(),
            application: joi.string().max(100).optional(),
            combination: joi.string().lowercase().max(20).regex(/^\S*$/).message('combination not include white space'),
        }).validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const { os, application, combination, limit } = validatedData;

        const filter = {};
        if (combination) {
            filter[`shortcutCombination.${combination}`] = { $exists: true };
        }

        // Minor check to take the support of IDHACK index stage if filter both os, application
        if (os && application) {
          filter._id = {
              application,
              os,
          }
        } else {
            if (os) {
                filter['_id.os'] = os;
            }
            if (application) {
                filter['_id.application'] = application;
            }
        }

        const result = await KeyboardShortcut.find(
            filter,
            {},
            {
                limit
            }
        );
        if (!result) {
            return res.status(404);
        }
        return res.status(200).json(result);
    } catch(err) {
        return res.status(400).json(err.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;
