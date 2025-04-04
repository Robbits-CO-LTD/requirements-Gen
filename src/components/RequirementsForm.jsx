import { useState } from 'react';

const RequirementsForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    projectOverview: '',
    targetUsers: '',
    mainFeatures: '',
    constraints: '',
    timeline: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // 必須項目のバリデーション
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'プロジェクト名は必須です';
    }
    
    if (!formData.projectOverview.trim()) {
      newErrors.projectOverview = 'プロジェクト概要は必須です';
    }
    
    if (!formData.targetUsers.trim()) {
      newErrors.targetUsers = '客先は必須です';
    }
    
    if (!formData.mainFeatures.trim()) {
      newErrors.mainFeatures = '主要機能は必須です';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">要件定義の基本情報を入力</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">
            プロジェクト名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            className={`form-input ${errors.projectName ? 'border-red-500' : ''}`}
            placeholder="例: 顧客管理システム"
          />
          {errors.projectName && <p className="text-red-500 text-sm mt-1">{errors.projectName}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">
            プロジェクト概要 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="projectOverview"
            value={formData.projectOverview}
            onChange={handleChange}
            className={`form-input h-24 ${errors.projectOverview ? 'border-red-500' : ''}`}
            placeholder="プロジェクトの目的や背景を記述してください"
          ></textarea>
          {errors.projectOverview && <p className="text-red-500 text-sm mt-1">{errors.projectOverview}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">
            客先 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="targetUsers"
            value={formData.targetUsers}
            onChange={handleChange}
            className={`form-input h-20 ${errors.targetUsers ? 'border-red-500' : ''}`}
            placeholder="例: 株式会社○○、▲▲工業など"
          ></textarea>
          {errors.targetUsers && <p className="text-red-500 text-sm mt-1">{errors.targetUsers}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">
            主要機能 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="mainFeatures"
            value={formData.mainFeatures}
            onChange={handleChange}
            className={`form-input h-32 ${errors.mainFeatures ? 'border-red-500' : ''}`}
            placeholder="実装する主な機能を箇条書きで記述してください"
          ></textarea>
          {errors.mainFeatures && <p className="text-red-500 text-sm mt-1">{errors.mainFeatures}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">
            制約条件
          </label>
          <textarea
            name="constraints"
            value={formData.constraints}
            onChange={handleChange}
            className="form-input h-20"
            placeholder="予算、技術的制約、納期などの条件があれば記述してください"
          ></textarea>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-1">
            スケジュール
          </label>
          <textarea
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className="form-input h-20"
            placeholder="例: 2025年6月末までに第一フェーズをリリース"
          ></textarea>
        </div>
        
        <div className="text-center">
          <button
            type="submit"
            className="btn btn-primary w-full max-w-xs"
          >
            要件定義書を生成
          </button>
          <p className="text-sm text-gray-500 mt-2">
            <span className="text-red-500">*</span> は必須項目です
          </p>
        </div>
      </form>
    </div>
  );
};

export default RequirementsForm;
