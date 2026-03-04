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

        const husna = await Patient.findOne({ name: /Husna/i });
        if (!husna) {
            console.log('Patient Husna not found');
        } else {
            console.log('\n=== HUSNA PATIENT DATA ===');
            console.log('ID:', husna._id);

            console.log('\n=== PRESCRIPTIONS FOR HUSNA (LATEST 5) ===');
            const pForHusna = await Prescription.find({ patient: husna._id })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('doctor', 'name assignedPharmacy')
                .populate('pharmacy', 'name');

            pForHusna.forEach(p => {
                console.log('---');
                console.log('ID:', p._id);
                console.log('Status:', p.status);
                console.log('Created At:', p.createdAt);
                console.log('Doctor:', p.doctor?.name || 'Unknown');
                console.log('Doctor Assigned Pharmacy (ID):', p.doctor?.assignedPharmacy || 'None');
                console.log('Prescription Target Pharmacy:', p.pharmacy ? p.pharmacy.name : 'NULL');
            });
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
};

debug();
