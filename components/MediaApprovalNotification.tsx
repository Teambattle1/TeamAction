import React, { useState, useEffect } from 'react';
import { Camera, Video, Bell } from 'lucide-react';
import { MediaSubmission } from '../types';
import { subscribeToMediaSubmissions, getPendingSubmissions } from '../services/mediaUpload';
import MediaApprovalModal from './MediaApprovalModal';

interface MediaApprovalNotificationProps {
  gameId: string;
  onApprove: (submissionId: string, partialScore?: number) => void;
  onReject: (submissionId: string, message: string) => void;
}

const MediaApprovalNotification: React.FC<MediaApprovalNotificationProps> = ({
  gameId,
  onApprove,
  onReject
}) => {
  const [pendingSubmissions, setPendingSubmissions] = useState<MediaSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<MediaSubmission | null>(null);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    // Load existing pending submissions
    loadPendingSubmissions();

    // Subscribe to new submissions
    const unsubscribe = subscribeToMediaSubmissions(gameId, (newSubmission) => {
      if (newSubmission.status === 'pending') {
        setPendingSubmissions((prev) => [newSubmission, ...prev]);
        setShowPulse(true);
        
        // Play notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUIJXfH8N2RQAsPWrLp66hVFApGn+PzvmwhBSuBzvLZiTUI');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [gameId]);

  const loadPendingSubmissions = async () => {
    const submissions = await getPendingSubmissions(gameId);
    setPendingSubmissions(submissions);
  };

  const handleSubmissionClick = (submission: MediaSubmission) => {
    setSelectedSubmission(submission);
    setShowPulse(false);
  };

  const handleApprove = async (submissionId: string, partialScore?: number) => {
    await onApprove(submissionId, partialScore);
    setPendingSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    setSelectedSubmission(null);
  };

  const handleReject = async (submissionId: string, message: string) => {
    await onReject(submissionId, message);
    setPendingSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    setSelectedSubmission(null);
  };

  if (pendingSubmissions.length === 0) return null;

  return (
    <>
      {/* Notification Badge */}
      <button
        onClick={() => setSelectedSubmission(pendingSubmissions[0])}
        className={`fixed top-4 right-4 z-[9000] bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-2xl transition-all ${
          showPulse ? 'animate-pulse' : ''
        }`}
        style={{
          animation: showPulse ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
        }}
      >
        <div className="relative p-4">
          <Bell className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
            {pendingSubmissions.length}
          </div>
        </div>
      </button>

      {/* Notification List (when expanded) */}
      {selectedSubmission && (
        <div className="fixed top-20 right-4 z-[9000] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-96 max-h-[500px] overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-purple-900/30 to-blue-900/30 sticky top-0">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Pending Approvals ({pendingSubmissions.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-700">
            {pendingSubmissions.map((submission) => (
              <button
                key={submission.id}
                onClick={() => handleSubmissionClick(submission)}
                className="w-full p-4 hover:bg-slate-800 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {submission.mediaType === 'photo' ? (
                    <Camera className="w-5 h-5 text-purple-400 shrink-0" />
                  ) : (
                    <Video className="w-5 h-5 text-blue-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {submission.pointTitle}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      Team: {submission.teamName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {selectedSubmission && (
        <MediaApprovalModal
          submission={selectedSubmission}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelectedSubmission(null)}
          partialScoreEnabled={false} // TODO: Get from task settings
        />
      )}
    </>
  );
};

export default MediaApprovalNotification;
