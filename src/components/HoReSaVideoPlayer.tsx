import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors } from '../constants/colors';

const OVERLAY_DARK =
  (Colors as any).overlayDark ?? 'rgba(0, 0, 0, 0.55)';
const OVERLAY_LIGHT =
  (Colors as any).overlayLight ?? 'rgba(255, 255, 255, 0.25)';

const IMAGE_EXT_REGEX =
  /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)(\?|#|$)/i;
const VIDEO_EXT_REGEX =
  /\.(mp4|mov|m4v|webm|3gp|mkv|avi|m3u8)(\?|#|$)/i;

function isImageUri(uri?: string): boolean {
  if (!uri) return false;
  const clean = uri.trim();
  if (!clean) return false;
  if (VIDEO_EXT_REGEX.test(clean) || clean.toLowerCase().includes('/video/')) {
    return false;
  }
  return (
    IMAGE_EXT_REGEX.test(clean) ||
    clean.toLowerCase().startsWith('data:image/') ||
    clean.toLowerCase().includes('images.unsplash.com')
  );
}

export interface HoReSaVideoPlayerProps {
  videoUri?: string;
  posterUri?: string;
  isActive?: boolean;
  muted?: boolean;
  showMuteButton?: boolean;
  muteButtonTop?: number;
}

interface ActiveVideoPlayerProps {
  sourceUri: string;
  posterUri?: string;
  isActive: boolean;
  isMuted: boolean;
  isPaused: boolean;
  retryKey: number;
  resizeMode: 'cover' | 'contain';
  showMuteButton: boolean;
  muteButtonTop: number;
  onTogglePause: () => void;
  onSetPaused: (paused: boolean) => void;
  onToggleMute: () => void;
  onLoadingChange: (loading: boolean) => void;
  onPlaybackError: (detail: string) => void;
}

const ActiveVideoPlayer: React.FC<ActiveVideoPlayerProps> = ({
  sourceUri,
  posterUri,
  isActive,
  isMuted,
  isPaused,
  retryKey,
  resizeMode,
  showMuteButton,
  muteButtonTop,
  onTogglePause,
  onSetPaused,
  onToggleMute,
  onLoadingChange,
  onPlaybackError,
}) => {
  const shouldPlay = Boolean(sourceUri && isActive && !isPaused);

  const player = useVideoPlayer(sourceUri, (instance) => {
    instance.loop = true;
    instance.muted = isMuted;
  });

  const triggerPlay = useCallback(() => {
    try {
      player.muted = isMuted;
      player.loop = true;
      if (shouldPlay) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // Ignoré pendant l'initialisation native
    }
  }, [player, isMuted, shouldPlay]);

  useEffect(() => {
    onLoadingChange(true);

    if (player.status === 'readyToPlay' || player.playing) {
      onLoadingChange(false);
      triggerPlay();
    }

    const statusSub = player.addListener('statusChange', (event) => {
      const status = event.status;
      if (status === 'error') {
        onLoadingChange(false);
        const errText =
          typeof event.error === 'string'
            ? event.error
            : event.error?.message || 'Flux vidéo inaccessible';
        onPlaybackError(errText);
      } else if (status === 'readyToPlay' || player.playing) {
        onLoadingChange(false);
        triggerPlay();
      } else if (status === 'loading') {
        onLoadingChange(true);
      }
    });

    const playingSub = player.addListener('playingChange', (event) => {
      if (event.isPlaying) {
        onLoadingChange(false);
      }
    });

    return () => {
      statusSub.remove();
      playingSub.remove();
    };
  }, [player, sourceUri, retryKey, onLoadingChange, onPlaybackError, triggerPlay]);

  useEffect(() => {
    try {
      player.muted = isMuted;
      player.loop = true;
    } catch {
      // Ignoré
    }
  }, [player, isMuted]);

  useEffect(() => {
    triggerPlay();
  }, [triggerPlay]);

  const handleTouchPress = useCallback(() => {
    if (isPaused) {
      onSetPaused(false);
      try {
        player.muted = isMuted;
        player.loop = true;
        player.play();
        onLoadingChange(false);
      } catch {
        onTogglePause();
      }
    } else {
      onTogglePause();
    }
  }, [isPaused, isMuted, player, onSetPaused, onLoadingChange, onTogglePause]);

  return (
    <>
      {Boolean(posterUri) && (
        <Image
          source={{ uri: posterUri }}
          style={styles.backdropBlur}
          resizeMode="cover"
          blurRadius={18}
        />
      )}

      <View style={styles.centerStage}>
        <VideoView
          key={`${sourceUri}-${retryKey}`}
          player={player}
          style={styles.fullMedia}
          contentFit={resizeMode}
          nativeControls={false}
        />
      </View>

      <TouchableOpacity
        activeOpacity={1}
        style={styles.touchLayer}
        onPress={handleTouchPress}
      >
        {isPaused && (
          <View style={styles.pausePill}>
            <Ionicons name="play" size={26} color={Colors.textOnPrimary} />
            <Text style={styles.pauseText}>Lire</Text>
          </View>
        )}
      </TouchableOpacity>

      {showMuteButton && (
        <TouchableOpacity
          style={[styles.muteButton, { top: muteButtonTop }]}
          onPress={onToggleMute}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={18}
            color={Colors.textOnPrimary}
          />
        </TouchableOpacity>
      )}
    </>
  );
};

export const HoReSaVideoPlayer: React.FC<HoReSaVideoPlayerProps> = ({
  videoUri,
  posterUri,
  isActive = true,
  muted: initialMuted = false,
  showMuteButton = true,
  muteButtonTop = 106,
}) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(initialMuted);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string>('');
  const [retryKey, setRetryKey] = useState<number>(0);
  const [mediaRatio, setMediaRatio] = useState<number | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const cleanVideoUri = videoUri?.trim() || undefined;
  const cleanPosterUri = posterUri?.trim() || undefined;

  const isVideoMode = useMemo(() => {
    if (!cleanVideoUri) return false;
    return !isImageUri(cleanVideoUri);
  }, [cleanVideoUri]);

  const safePosterUri = useMemo(() => {
    if (!cleanPosterUri) return undefined;
    if (isVideoMode && cleanPosterUri === cleanVideoUri) return undefined;
    return cleanPosterUri;
  }, [cleanPosterUri, cleanVideoUri, isVideoMode]);

  const activeSourceUri = isVideoMode
    ? cleanVideoUri
    : cleanPosterUri || cleanVideoUri;

  useEffect(() => {
    setIsMuted(initialMuted);
  }, [initialMuted]);

  useEffect(() => {
    setHasError(false);
    setErrorDetail('');
    setIsPaused(false);
    setMediaRatio(null);
    setIsLoading(Boolean(isVideoMode && activeSourceUri));
  }, [activeSourceUri, isVideoMode, retryKey]);

  useEffect(() => {
    if (!isActive) {
      setIsPaused(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isVideoMode && activeSourceUri && isLoading && !hasError) {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
        setErrorDetail('Délai de chargement dépassé. Vérifiez la connexion.');
      }, 12000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isVideoMode, activeSourceUri, isLoading, hasError]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    if (!loading && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(loading);
  }, []);

  const handlePlaybackError = useCallback((detail: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
    setHasError(true);
    setErrorDetail(detail);
  }, []);

  const handleRetryVideo = useCallback(() => {
    setHasError(false);
    setErrorDetail('');
    setIsPaused(false);
    setIsLoading(true);
    setRetryKey((prev) => prev + 1);
  }, []);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height }
      );
    }
  }, []);

  const adaptiveResizeMode: 'cover' | 'contain' = useMemo(() => {
    if (!mediaRatio || containerSize.width === 0 || containerSize.height === 0) {
      return 'contain';
    }
    const containerRatio = containerSize.width / containerSize.height;
    const bothPortrait = mediaRatio <= 0.85 && containerRatio <= 0.85;
    const ratioDiff = Math.abs(mediaRatio - containerRatio) / containerRatio;
    return bothPortrait || ratioDiff <= 0.22 ? 'cover' : 'contain';
  }, [containerSize.height, containerSize.width, mediaRatio]);

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      {isVideoMode && activeSourceUri && !hasError ? (
        <ActiveVideoPlayer
          key={`${activeSourceUri}-${retryKey}`}
          sourceUri={activeSourceUri}
          posterUri={safePosterUri}
          isActive={isActive}
          isMuted={isMuted}
          isPaused={isPaused}
          retryKey={retryKey}
          resizeMode={adaptiveResizeMode}
          showMuteButton={showMuteButton}
          muteButtonTop={muteButtonTop}
          onTogglePause={() => setIsPaused((prev) => !prev)}
          onSetPaused={setIsPaused}
          onToggleMute={() => setIsMuted((prev) => !prev)}
          onLoadingChange={handleLoadingChange}
          onPlaybackError={handlePlaybackError}
        />
      ) : !isVideoMode && activeSourceUri ? (
        <Image
          source={{ uri: activeSourceUri }}
          style={styles.fullMedia}
          resizeMode={adaptiveResizeMode}
          onLoad={() => setIsLoading(false)}
        />
      ) : (
        <View style={styles.fallbackBox}>
          {Boolean(safePosterUri) && (
            <Image
              source={{ uri: safePosterUri }}
              style={styles.backdropBlur}
              resizeMode="cover"
              blurRadius={6}
            />
          )}
          <Ionicons
            name="videocam-outline"
            size={38}
            color={Colors.textOnPrimary}
          />
          <Text style={styles.fallbackText}>
            {hasError ? 'Lecture vidéo impossible' : 'Aucune vidéo sélectionnée'}
          </Text>
          {Boolean(errorDetail) && (
            <Text style={styles.errorDetailText} numberOfLines={3}>
              {errorDetail}
            </Text>
          )}
          {hasError && Boolean(activeSourceUri) && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleRetryVideo}
              activeOpacity={0.85}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={Colors.textOnPrimary}
              />
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading && isVideoMode && !hasError && (
        <View pointerEvents="none" style={styles.loaderOverlay}>
          <View style={styles.loaderBadge}>
            <ActivityIndicator size="small" color={Colors.textOnPrimary} />
          </View>
        </View>
      )}
    </View>
  );
};

export default HoReSaVideoPlayer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backdropBlur: {
    ...StyleSheet.absoluteFill,
    opacity: 0.32,
  },
  centerStage: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullMedia: {
    width: '100%',
    height: '100%',
  },
  fallbackBox: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    zIndex: 12,
  },
  fallbackText: {
    color: Colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorDetailText: {
    color: Colors.primaryLight,
    fontSize: 11,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  retryBtnText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  touchLayer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  loaderBadge: {
    backgroundColor: OVERLAY_DARK,
    padding: 12,
    borderRadius: 24,
  },
  pausePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: OVERLAY_DARK,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: OVERLAY_LIGHT,
  },
  pauseText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  muteButton: {
    position: 'absolute',
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: OVERLAY_DARK,
    borderWidth: 1,
    borderColor: OVERLAY_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});