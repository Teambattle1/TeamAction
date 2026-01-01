import React, { useState, useEffect } from 'react';
import { MediaSubmission } from '../types';
import { CheckCircle, XCircle, MessageSquare, Clock, Image as ImageIcon, Video, User, MapPin, Loader2 } from 'lucide-react';
import * as db from '../services/db';

interface LiveApprovalFeedProps {
  gameId: string;
  onApprove: (submissionId: string, comment?: string) => void;
  onReject: (submissionId: string, comment: string) => void;
  onJumpToTeam?: (teamId: string) => void;
}

const LiveApprovalFeed: React.FC<LiveApprovalFeedProps> = ({ gameId, onApprove, onReject, onJumpToTeam }) => {
  const [submissions, setSubmissions] = useState<MediaSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<MediaSubmission | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load submissions on mount and poll for updates
  useEffect(() => {
    loadSubmissions();
    const interval = setInterval(loadSubmissions, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [gameId]);

  const loadSubmissions = async () => {
    try {
      const data = await db.getMediaSubmissions(gameId);
      setSubmissions(data.filter(s => s.status === 'pending')); // Only show pending
      setLoading(false);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setIsSubmitting(true);
    
    try {
      await onApprove(selectedSubmission.id, reviewComment || undefined);
      setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id));
      setSelectedSubmission(null);
      setReviewComment('');
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    if (!reviewComment.trim()) {
      alert('⚠️ Please provide a rejection comment explaining why.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onReject(selectedSubmission.id, reviewComment);
      setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id));
      setSelectedSubmission(null);
      setReviewComment('');
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">No Pending Reviews</p>
        <p className="text-xs text-gray-400 mt-2">All submissions have been reviewed</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-black text-sm text-white uppercase tracking-wider">Live Approval Feed</h2>
            <p className="text-xs text-gray-400">Review photo/video submissions</p>
          </div>
        </div>
        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          {submissions.length} PENDING
        </div>
      </div>

      {/* Submission List */}
      {!selectedSubmission ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {submissions.map(submission => (
            <button
              key={submission.id}
              onClick={() => setSelectedSubmission(submission)}
              className="w-full bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 rounded-xl p-4 transition-all hover:border-orange-500 text-left"
            >
              <div className="flex items-start gap-3">
                {/* Media Preview */}
                <div className="w-20 h-20 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 border border-slate-600">
                  {submission.mediaType === 'photo' ? (
                    <img 
                      src={submission.mediaUrl} 
                      alt="Submission" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <Video className="w-8 h-8 text-orange-500" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="font-bold text-sm text-white truncate">{submission.teamName}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 truncate">{submission.pointTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500">
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Type Badge */}
                <div className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                  submission.mediaType === 'photo' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {submission.mediaType}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Review Modal */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedSubmission(null);
                setReviewComment('');
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors mb-4"
            >
              ← Back to List
            </button>

            {/* Team Info */}
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="font-black text-white text-lg">{selectedSubmission.teamName}</span>
                </div>
                {onJumpToTeam && (
                  <button
                    onClick={() => onJumpToTeam(selectedSubmission.teamId)}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    JUMP TO TEAM
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>{selectedSubmission.pointTitle}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Media Display */}
            <div className="bg-slate-800 border border-slate-600 rounded-xl overflow-hidden">
              {selectedSubmission.mediaType === 'photo' ? (
                <img 
                  src={selectedSubmission.mediaUrl} 
                  alt="Submission" 
                  className="w-full max-h-96 object-contain bg-black"
                />
              ) : (
                <video 
                  src={selectedSubmission.mediaUrl} 
                  controls 
                  className="w-full max-h-96 bg-black"
                />
              )}
            </div>

            {/* Review Comment */}
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Review Comment (Optional for approval, required for rejection)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add a comment for the team..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    REJECT
                  </>
                )}
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    APPROVE
                  </>
                )}
              </button>
            </div>

            {/* Help Text */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <p className="text-xs text-orange-300">
                💡 <strong>Approval:</strong> Marks the task as completed for this team. <strong>Rejection:</strong> Team must resubmit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveApprovalFeed;
