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

        console.log('\n=== SEARCHING FOR BAROLE 20 PRESCRIPTIONS ===');
        const prescriptions = await Prescription.find({
            'medicines.name': /BAROLE 20/i
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('doctor')
            .populate('pharmacy');

        prescriptions.forEach(p => {
            console.log('---');
            console.log('Prescription ID:', p._id);
            console.log('Created At:', p.createdAt);
            console.log('Doctor Name:', p.doctor?.name);
            console.log('Doctor Role:', p.doctor?.role);
            console.log('Doctor AssignedPharmacy Field (Raw):', p.doctor?.assignedPharmacy);
            console.log('Prescription Pharmacy Field:', p.pharmacy ? p.pharmacy.name : 'NULL');
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
};

debug();
