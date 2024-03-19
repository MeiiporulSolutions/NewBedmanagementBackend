const { body } = require('express-validator');

// Define validation middleware for admitting a patient
const admitPatientValidationRules = () => {
    return [
        body('patientName').trim().notEmpty().withMessage('Patient name is required'),
        body('age').notEmpty().isInt().withMessage('Age must be a valid number'),
        body('gender').notEmpty().withMessage('Gender is required'),
        body('contactno').notEmpty().isMobilePhone().withMessage('Contact number must be a valid mobile phone number'),
        body('wardId').notEmpty().withMessage('Ward ID is required'),
        body('wardName').notEmpty().withMessage('Ward name is required'),
        body('bedNumber').notEmpty().withMessage('Bed number must be a valid number'),
        body('medicalAcuity').notEmpty().withMessage('Medical acuity is required'),
        body('admittingDoctors').notEmpty().withMessage('Admitting doctors are required'),
        body('admissionDate').notEmpty().withMessage('Admission date must be a valid date'),
        body('admissionTime').notEmpty().withMessage('Admission time is required'),
        body('assignedNurse').notEmpty().withMessage('Assigned nurse is required'),
        body('address').notEmpty().withMessage('Address is required'),
        body('abhaNo').notEmpty().withMessage('Abha number is required'),
        body('infectionStatus').notEmpty().withMessage('Infection status is required'),
    ];
};

module.exports = {
    admitPatientValidationRules,
};
