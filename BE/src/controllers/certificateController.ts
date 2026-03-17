import { Request, Response } from 'express';
import Certificate from '../models/Certificate';


export const createCertificate = async (req: Request, res: Response) => {
  try {
    const newCertificate = new Certificate(req.body);
    const savedCertificate = await newCertificate.save();
    res.status(201).json(savedCertificate);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};


export const getAllCertificates = async (req: Request, res: Response) => {
  try {
    const certificates = await Certificate.find().populate('consultant_id');
    res.status(200).json(certificates);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


export const getCertificateById = async (req: Request, res: Response) => {
  try {
    const certificate = await Certificate.findById(req.params.id).populate('consultant_id');
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json(certificate);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


export const updateCertificate = async (req: Request, res: Response) => {
  try {
    const updatedCertificate = await Certificate.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('consultant_id');
    if (!updatedCertificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json(updatedCertificate);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};


export const deleteCertificate = async (req: Request, res: Response) => {
  try {
    const deletedCertificate = await Certificate.findByIdAndDelete(req.params.id);
    if (!deletedCertificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(200).json({ message: 'Certificate deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getCertificatesByConsultantId = async (req: Request, res: Response) => {
  try {
    const { consultantId } = req.params; // Lấy consultantId từ params
    const certificates = await Certificate.find({ consultant_id: consultantId }).populate('consultant_id');

    if (certificates.length === 0) {
      return res.status(404).json({ message: 'No certificates found for this consultant' });
    }

    res.status(200).json(certificates);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

