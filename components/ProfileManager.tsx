

import React, { useState } from 'react';
import AIAssistant from './AIAssistant';
import UserProfile from './UserProfile';
import ClubProfile from './ClubProfile';
import { SparklesIcon, UserCircleIcon, BuildingStorefrontIcon } from '../constants';
import { UserProfileData, ClubProfileData } from '../types';

interface ProfileManagerProps {
    userProfile: UserProfileData;
    clubProfile: ClubProfileData;
    onUpdateUserProfile: (updatedProfile: UserProfileData) => void;
}

type ActiveTab = 'user' | 'club' | 'ai';

const ProfileManager: React.FC<ProfileManagerProps> = ({ userProfile, clubProfile, onUpdateUserProfile }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('user');

    const getTabClass = (tabName: ActiveTab) => {
        return `flex-1 py-2 px-1 text-center border-b-2 font-medium text-sm cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 ${
            activeTab === tabName
                ? 'border-primary text-primary'
                : 'border-transparent text-light-secondary hover:text-light-primary hover:border-slate-600'
        }`;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-dark-tertiary mb-6">
                <nav className="flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('user')} className={getTabClass('user')} role="tab" aria-selected={activeTab === 'user'}>
                        <UserCircleIcon className="h-5 w-5" /> Mi Perfil
                    </button>
                    <button onClick={() => setActiveTab('club')} className={getTabClass('club')} role="tab" aria-selected={activeTab === 'club'}>
                        <BuildingStorefrontIcon className="h-5 w-5" /> El Club
                    </button>
                    <button onClick={() => setActiveTab('ai')} className={getTabClass('ai')} role="tab" aria-selected={activeTab === 'ai'}>
                         <SparklesIcon className="h-5 w-5" /> Asistente IA
                    </button>
                </nav>
            </div>

            <div className="flex-grow">
                {activeTab === 'user' && <UserProfile profile={userProfile} onUpdate={onUpdateUserProfile} />}
                {activeTab === 'club' && <ClubProfile profile={clubProfile} />}
                {activeTab === 'ai' && <AIAssistant userProfile={userProfile} />}
            </div>
        </div>
    );
};

export default ProfileManager;