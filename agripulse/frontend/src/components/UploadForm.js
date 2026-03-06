import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const CROPS = ['TOMATO', 'WHEAT', 'RICE', 'MAIZE'];
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Upload form component — CSV file upload + crop selection.
 * All text is pulled from translation files via useLanguage().
 */
function UploadForm({ setResults, setLoading, setError }) {
  const [file, setFile] = useState(null);
  const [crop, setCrop] = useState('');
  const { t, lang } = useLanguage();

  /** Map crop enum to translated display name */
  const cropLabel = (c) => t(`crop_${c.toLowerCase()}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults([]);

    if (!file) {
      setError(t('error_no_file'));
      return;
    }
    if (!crop) {
      setError(t('error_no_crop'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('crop', crop);
    formData.append('lang', lang); // send language to backend for AI explanation

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/analyze-soil`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(response.data.results);
      // Also log to console as required
      console.log('AgriPulse Analysis Results:', JSON.stringify(response.data.results, null, 2));
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setError(`${t('error_analysis_failed')}: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-card">
      <h2>📤 {t('upload_title')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="csv-file">{t('csv_label')}</label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>
        <div className="form-group">
          <label htmlFor="crop-select">{t('crop_label')}</label>
          <select
            id="crop-select"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
          >
            <option value="">{t('crop_placeholder')}</option>
            {CROPS.map((c) => (
              <option key={c} value={c}>{cropLabel(c)}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-analyze">
          {t('btn_analyze')}
        </button>
      </form>
    </div>
  );
}

export default UploadForm;
