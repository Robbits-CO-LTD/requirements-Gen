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
    <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-medium text-gray-900">要件定義の基本情報を入力</h2>
        <p className="mt-1 text-xs text-gray-600">こちらで要件を詳しく伝えると自動的に要件定義書に反映されます</p>
      </div>
      <div className="p-5">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクト名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className={`block w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none ${errors.projectName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="例: 顧客管理システム"
              />
              {errors.projectName && <p className="text-red-600 text-xs mt-1">{errors.projectName}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロジェクト概要 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="projectOverview"
                value={formData.projectOverview}
                onChange={handleChange}
                className={`block w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none ${errors.projectOverview ? 'border-red-500' : 'border-gray-300'}`}
                rows="4"
                placeholder="プロジェクトの目的や背景を記述してください"
              ></textarea>
              {errors.projectOverview && <p className="text-red-600 text-xs mt-1">{errors.projectOverview}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                客先 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="targetUsers"
                value={formData.targetUsers}
                onChange={handleChange}
                className={`block w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none ${errors.targetUsers ? 'border-red-500' : 'border-gray-300'}`}
                rows="3"
                placeholder="例: 株式会社○○、▲▲工業など"
              ></textarea>
              {errors.targetUsers && <p className="text-red-600 text-xs mt-1">{errors.targetUsers}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                主要機能 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="mainFeatures"
                value={formData.mainFeatures}
                onChange={handleChange}
                className={`block w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none ${errors.mainFeatures ? 'border-red-500' : 'border-gray-300'}`}
                rows="5"
                placeholder="実装する主な機能を箇条書きで記述してください"
              ></textarea>
              {errors.mainFeatures && <p className="text-red-600 text-xs mt-1">{errors.mainFeatures}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                制約条件
              </label>
              <textarea
                name="constraints"
                value={formData.constraints}
                onChange={handleChange}
                className="block w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none border-gray-300"
                rows="3"
                placeholder="予算、技術的制約、納期などの条件があれば記述してください"
              ></textarea>
            </div>
          
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                スケジュール
              </label>
              <textarea
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                className="block w-full px-3 py-2 text-sm border rounded-md shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none border-gray-300"
                rows="3"
                placeholder="例: 2025年6月末までに第一フェーズをリリース"
              ></textarea>
            </div>
            
            <div className="flex justify-between items-center mt-8">
              <p className="text-xs text-gray-500">
                <span className="text-red-500">*</span> は必須項目です
              </p>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
              >
                要件定義書を生成
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequirementsForm;
