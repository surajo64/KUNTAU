const mongoose = require('mongoose');
const User = require('./models/userModel');
const Pharmacy = require('./models/pharmacyModel');
const Prescription = require('./models/prescriptionModel');
const Patient = require('./models/patientModel');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const husna = await Patient.findOne({ name: /Husna/i });
        if (husna) {
            console.log('\n--- PRESCRIPTIONS FOR HUSNA ---');
            const pForHusna = await Prescription.find({ patient: husna._id })
                .populate('doctor', 'name assignedPharmacy')
                .populate('pharmacy', 'name');

            console.log(JSON.stringify(pForHusna.map(p => ({
                id: p._id,
                doctorName: p.doctor?.name,
                doctorAssignedPharmacy: p.doctor?.assignedPharmacy,
                prescriptionPharmacy: p.pharmacy ? p.pharmacy.name : 'NULL',
                createdAt: p.createdAt
            })), null, 2));
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

debug();
