import * as patientService from "../services/patient.service.js";

export const createPatient = async (req, res, next) => {
  try {
    const facilityId = req.user?.facilityId;
    const userId = req.user?.id;

    const patient = await patientService.createPatient(
      req.body,
      facilityId,
      userId
    );

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

export const getPatients = async (req, res, next) => {
  try {
    const facilityId = req.user?.facilityId;
    if (!facilityId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: staff user is not assigned to a facility",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const search = req.query.search?.trim();

    const result = await patientService.getPatients({
      facilityId,
      page,
      limit,
      search
    });

    res.status(200).json({
      success: true,
      data: result.patients,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const facilityId = req.user?.facilityId;
    if (!facilityId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: staff user is not assigned to a facility",
      });
    }

    const patient = await patientService.getPatientById(
      req.params.id,
      facilityId
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const facilityId = req.user?.facilityId;
    if (!facilityId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: staff user is not assigned to a facility",
      });
    }

    const patient = await patientService.updatePatient(
      req.params.id,
      facilityId,
      req.body
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const facilityId = req.user?.facilityId;
    if (!facilityId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: staff user is not assigned to a facility",
      });
    }

    const deleted = await patientService.deletePatient(
      req.params.id,
      facilityId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};