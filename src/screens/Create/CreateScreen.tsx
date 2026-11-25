import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Colors } from '../../constants/colors';
import { MainTabParamList } from '../../navigation/navigationTypes';
import { PostCategory } from '../../types/post';
import { useReelsStore } from '../../store/reelsStore';
import { useHomePostsStore } from '../../store/homePostsStore';
import HoReSaVideoPlayer from '../../components/HoReSaVideoPlayer';

type CreateNavProp = BottomTabNavigationProp<MainTabParamList, 'Create'>;

interface GalleryThumbItem {
  id: string;
  uri: string;
  isVideo: boolean;
}

const FILTERS = ['Naturel', 'Éclat HoReSa', 'Cinéma', 'Chaud', 'Noir & Blanc'];
const SPEEDS = ['0.5x', '1x', '1.5x', '2x'];
const FORMATS = ['Reel Vertical', 'Publication Accueil'];
const CATEGORIES: PostCategory[] = [
  'Hôtels',
  'Restaurants',
  'Salles',
  'Événements',
  'Offres',
];

const FALLBACK_POSTER_URI =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80';

function detectVideoAsset(asset: any, uri?: string): boolean {
  const target = uri || asset?.localUri || asset?.uri || '';
  return (
    asset?.mediaType === 'video' ||
    asset?.type === 'video' ||
    /\.(mp4|mov|m4v|webm|3gp|mkv|avi)$/i.test(target)
  );
}

export const CreateScreen: React.FC = () => {
  const navigation = useNavigation<CreateNavProp>();
  const isFocused = useIsFocused();
  const { publishReel } = useReelsStore();
  const { publishHomePost } = useHomePostsStore();

  const [pickedVideoUri, setPickedVideoUri] = useState<string | null>(null);
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [playPreviewVideo, setPlayPreviewVideo] = useState<boolean>(false);
  const [recentGalleryItems, setRecentGalleryItems] = useState<GalleryThumbItem[]>([]);
  const [galleryStatusText, setGalleryStatusText] = useState<string>(
    'Chargement de la galerie...'
  );

  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('Bukavu');
  const [price, setPrice] = useState<string>('');
  const [caption, setCaption] = useState<string>('');

  const [selectedFilter, setSelectedFilter] = useState<string>('Éclat HoReSa');
  const [selectedSpeed, setSelectedSpeed] = useState<string>('1x');
  const [selectedFormat, setSelectedFormat] =
    useState<string>('Reel Vertical');
  const [selectedCategory, setSelectedCategory] =
    useState<PostCategory>('Hôtels');

  const applySelectedAsset = useCallback((asset: any, autoPlay = true) => {
    const rawLocal =
      typeof asset?.localUri === 'string' ? asset.localUri.trim() : '';
    const rawUri = typeof asset?.uri === 'string' ? asset.uri.trim() : '';
    const uri = rawLocal || rawUri;
    if (!uri) return;

    const isVideo = detectVideoAsset(asset, uri);

    if (isVideo) {
      setPickedVideoUri(uri);
      setPickedImageUri(null);
      setPlayPreviewVideo(autoPlay);
      setGalleryStatusText('Vidéo sélectionnée depuis la galerie');
    } else {
      setPickedImageUri(uri);
      setPickedVideoUri(null);
      setPlayPreviewVideo(false);
      setGalleryStatusText('Photo sélectionnée depuis la galerie');
    }
  }, []);

  const loadGalleryMedia = useCallback(async () => {
    try {
      const MediaLibrary = require('expo-media-library');
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission?.granted) {
        setGalleryStatusText(
          'Autorisez la galerie ou appuyez sur « Galerie ».'
        );
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: 6,
        mediaType: [
          MediaLibrary.MediaType.photo,
          MediaLibrary.MediaType.video,
        ],
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      const assets = Array.isArray(result?.assets) ? result.assets : [];
      if (assets.length === 0) {
        setGalleryStatusText('Aucun média récent dans la galerie.');
        return;
      }

      const resolvedAssets = await Promise.all(
        assets.map(async (item: any) => {
          if (typeof MediaLibrary.getAssetInfoAsync === 'function' && item?.id) {
            try {
              const info = await MediaLibrary.getAssetInfoAsync(item.id);
              if (info) {
                return {
                  ...item,
                  ...info,
                  localUri: info.localUri ?? item.localUri,
                  uri: info.localUri ?? info.uri ?? item.uri,
                };
              }
            } catch {
              // Conserver l'élément d'origine
            }
          }
          return item;
        })
      );

      const thumbs: GalleryThumbItem[] = resolvedAssets
        .map((a: any, index: number) => {
          const u = a?.localUri || a?.uri;
          if (!u) return null;
          return {
            id: String(a?.id ?? `thumb-${index}`),
            uri: u,
            isVideo: detectVideoAsset(a, u),
          };
        })
        .filter((x: GalleryThumbItem | null): x is GalleryThumbItem => Boolean(x));

      setRecentGalleryItems(thumbs);
      applySelectedAsset(resolvedAssets[0], true);
    } catch {
      setGalleryStatusText('Utilisez « Galerie » pour choisir un média.');
    }
  }, [applySelectedAsset]);

  useEffect(() => {
    loadGalleryMedia();
  }, [loadGalleryMedia]);

  const handlePickDeviceMedia = useCallback(async () => {
    try {
      const ImagePicker = require('expo-image-picker');
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission refusée',
          'Activez l’accès aux photos et vidéos dans les réglages de votre téléphone.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      applySelectedAsset(result.assets[0], true);
    } catch (err) {
      console.warn('Erreur sélection média téléphone :', err);
      Alert.alert(
        'Impossible d’ouvrir la galerie',
        'Vérifiez que expo-image-picker est installé et relancez avec npx expo start -c.'
      );
    }
  }, [applySelectedAsset]);

  const resetFormAfterPublish = useCallback(() => {
    setTitle('');
    setPrice('');
    setCaption('');
  }, []);

  const handlePublish = useCallback(() => {
    const trimmedCaption = caption.trim();
    const trimmedTitle = title.trim();
    const hasLocalMedia = Boolean(pickedImageUri || pickedVideoUri);

    if (!trimmedCaption && !trimmedTitle && !hasLocalMedia) {
      Alert.alert(
        'Contenu incomplet',
        'Choisissez un fichier depuis votre téléphone ou saisissez une légende.'
      );
      return;
    }

    const finalCaption =
      trimmedCaption ||
      trimmedTitle ||
      `Publication ${selectedCategory} à ${location.trim() || 'Bukavu'}`;
    const finalTitle =
      trimmedTitle || `${selectedCategory} • ${selectedFilter}`;
    const finalLocation = location.trim() || 'Bukavu';
    const finalPrice = price.trim() || undefined;

    const posterUrl =
      pickedImageUri || pickedVideoUri || FALLBACK_POSTER_URI;
    const videoUrl = pickedImageUri
      ? undefined
      : pickedVideoUri || undefined;

    setPlayPreviewVideo(false);

    if (selectedFormat === 'Publication Accueil') {
      publishHomePost({
        author: {
          id: 'auth-horesa-member',
          name: 'Espace HoReSa Officiel',
          handle: '@horesa_membre',
          role: 'particulier',
          verified: true,
        },
        title: finalTitle,
        content: finalCaption,
        category: selectedCategory,
        location: finalLocation,
        price: finalPrice,
        images: [posterUrl],
        videoUrl,
        createdAt: 'À l’instant',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        bookmarksCount: 0,
        isLiked: false,
        isBookmarked: false,
        comments: [],
      });

      resetFormAfterPublish();

      Alert.alert(
        'Contenu publié',
        'Votre publication est visible dans l’accueil HoReSa.',
        [
          {
            text: 'Voir l’accueil',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
      return;
    }

    publishReel({
      authorName: 'Espace HoReSa Officiel',
      handle: '@horesa_membre',
      role: selectedCategory,
      city: finalLocation,
      verified: true,
      caption: finalPrice ? `${finalCaption} • ${finalPrice}` : finalCaption,
      audioTitle: `Son original • ${selectedFilter} (${selectedSpeed})`,
      mediaUrl: posterUrl,
      videoUrl: videoUrl || '',
      durationLabel: pickedImageUri ? 'Photo' : 'Galerie',
      likes: 0,
      comments: [],
      shares: 0,
      followers: '1,8 k',
      followingCount: '540',
      postsCount: 49,
      isLiked: false,
      isSaved: false,
      isFollowing: false,
    });

    resetFormAfterPublish();

    Alert.alert(
      'Reel publié',
      'Votre Reel est disponible dans l’onglet Reels.',
      [
        {
          text: 'Voir les Reels',
          onPress: () => navigation.navigate('Reels'),
        },
      ]
    );
  }, [
    caption,
    location,
    navigation,
    pickedImageUri,
    pickedVideoUri,
    price,
    publishHomePost,
    publishReel,
    resetFormAfterPublish,
    selectedCategory,
    selectedFilter,
    selectedFormat,
    selectedSpeed,
    title,
  ]);

  const previewPosterUri = pickedImageUri
    ? pickedImageUri
    : pickedVideoUri
    ? undefined
    : FALLBACK_POSTER_URI;

  const previewVideoUri = pickedImageUri ? undefined : pickedVideoUri || undefined;
  const activeThumbUri = pickedImageUri || pickedVideoUri || FALLBACK_POSTER_URI;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* En-tête type Instagram */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nouvelle publication</Text>
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={handlePublish}
          activeOpacity={0.85}
        >
          <Text style={styles.publishText}>Partager</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Fenêtre principale d'aperçu */}
        <View style={styles.previewStage}>
          {playPreviewVideo && previewVideoUri ? (
            <HoReSaVideoPlayer
              videoUri={previewVideoUri}
              posterUri={previewPosterUri}
              isActive={isFocused && playPreviewVideo}
              muteButtonTop={12}
            />
          ) : previewPosterUri ? (
            <Image
              source={{ uri: previewPosterUri }}
              style={styles.previewImage}
              resizeMode={pickedImageUri ? 'contain' : 'cover'}
            />
          ) : (
            <View style={styles.localVideoPlaceholder}>
              <Ionicons
                name="videocam"
                size={38}
                color={Colors.textOnPrimary}
              />
              <Text style={styles.localVideoPlaceholderText}>
                Vidéo sélectionnée depuis la galerie
              </Text>
            </View>
          )}
        </View>

        {/* Barre d'actions type Instagram sous l'aperçu */}
        <View style={styles.toolbarRow}>
          <Text style={styles.toolbarStatus} numberOfLines={1}>
            {galleryStatusText}
          </Text>

          <View style={styles.toolbarButtons}>
            {Boolean(previewVideoUri) && (
              <TouchableOpacity
                style={styles.toolChip}
                onPress={() => setPlayPreviewVideo((prev) => !prev)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={playPreviewVideo ? 'pause' : 'play'}
                  size={15}
                  color={Colors.primary}
                />
                <Text style={styles.toolChipText}>
                  {playPreviewVideo ? 'Pause' : 'Lire'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.toolChipPrimary}
              onPress={handlePickDeviceMedia}
              activeOpacity={0.85}
            >
              <Ionicons
                name="images-outline"
                size={15}
                color={Colors.textOnPrimary}
              />
              <Text style={styles.toolChipPrimaryText}>Galerie</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grille rapide des récents fichiers de la galerie */}
        {recentGalleryItems.length > 0 && (
          <View style={styles.galleryGrid}>
            {recentGalleryItems.map((item) => {
              const isSelected =
                pickedVideoUri === item.uri || pickedImageUri === item.uri;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridTile,
                    isSelected && styles.gridTileSelected,
                  ]}
                  onPress={() =>
                    applySelectedAsset(
                      {
                        uri: item.uri,
                        mediaType: item.isVideo ? 'video' : 'photo',
                      },
                      item.isVideo
                    )
                  }
                  activeOpacity={0.85}
                >
                  {item.isVideo ? (
                    <View style={styles.videoTileBox}>
                      <Ionicons
                        name="videocam"
                        size={20}
                        color={Colors.textOnPrimary}
                      />
                      <Text style={styles.videoTileLabel} numberOfLines={1}>
                        Vidéo
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.tileImage}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bloc légende + miniature active façon Instagram */}
        <View style={styles.captionComposerCard}>
          <View style={styles.miniThumbBox}>
            {pickedVideoUri && !pickedImageUri ? (
              <Ionicons
                name="videocam"
                size={24}
                color={Colors.textOnPrimary}
              />
            ) : (
              <Image
                source={{ uri: activeThumbUri }}
                style={styles.miniThumbImage}
                resizeMode="cover"
              />
            )}
          </View>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Écrire une légende..."
            placeholderTextColor={Colors.textSecondary}
            style={styles.captionInput}
            multiline
          />
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Titre de l’offre, suite ou plat..."
          placeholderTextColor={Colors.textSecondary}
          style={styles.singleInput}
        />

        <View style={styles.twoColsRow}>
          <View style={styles.colItem}>
            <Text style={styles.sectionLabel}>Ajouter un lieu</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Bukavu, Goma..."
              placeholderTextColor={Colors.textSecondary}
              style={styles.singleInput}
            />
          </View>

          <View style={styles.colItem}>
            <Text style={styles.sectionLabel}>Tarif / Prix</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="Ex. 65 $ / nuit"
              placeholderTextColor={Colors.textSecondary}
              style={styles.singleInput}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Destination</Text>
        <View style={styles.rowWrap}>
          {FORMATS.map((fmt) => (
            <TouchableOpacity
              key={fmt}
              style={[
                styles.chip,
                selectedFormat === fmt && styles.chipActive,
              ]}
              onPress={() => setSelectedFormat(fmt)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedFormat === fmt && styles.chipTextActive,
                ]}
              >
                {fmt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Catégorie HoReSa</Text>
        <View style={styles.rowWrap}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                selectedCategory === cat && styles.chipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === cat && styles.chipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Filtre & Vitesse</Text>
        <View style={styles.rowWrap}>
          {FILTERS.map((flt) => (
            <TouchableOpacity
              key={flt}
              style={[
                styles.chip,
                selectedFilter === flt && styles.chipActive,
              ]}
              onPress={() => setSelectedFilter(flt)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedFilter === flt && styles.chipTextActive,
                ]}
              >
                {flt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rowWrap}>
          {SPEEDS.map((spd) => (
            <TouchableOpacity
              key={spd}
              style={[
                styles.chip,
                selectedSpeed === spd && styles.chipActive,
              ]}
              onPress={() => setSelectedSpeed(spd)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedSpeed === spd && styles.chipTextActive,
                ]}
              >
                {spd}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.bigPublishButton}
          onPress={handlePublish}
          activeOpacity={0.85}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={20}
            color={Colors.textOnPrimary}
          />
          <Text style={styles.bigPublishButtonText}>
            Publier maintenant ({selectedFormat})
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CreateScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  publishBtn: {
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  publishText: {
    color: Colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  content: {
    padding: 12,
    paddingBottom: 36,
    gap: 10,
  },
  previewStage: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.primaryDark,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  localVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  localVideoPlaceholderText: {
    color: Colors.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  toolbarStatus: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  toolChipText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  toolChipPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
  },
  toolChipPrimaryText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridTile: {
    width: '32%',
    height: 76,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridTileSelected: {
    borderColor: Colors.primary,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  videoTileBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryDark,
  },
  videoTileLabel: {
    color: Colors.textOnPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  captionComposerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
  },
  miniThumbBox: {
    width: 54,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniThumbImage: {
    width: '100%',
    height: '100%',
  },
  captionInput: {
    flex: 1,
    minHeight: 64,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingTop: 2,
  },
  singleInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  twoColsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colItem: {
    flex: 1,
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  bigPublishButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bigPublishButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});