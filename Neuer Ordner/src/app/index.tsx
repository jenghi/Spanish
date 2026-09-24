import { router } from "expo-router";
import { useMemo, useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  alleVokabeln,
  kategorien,
} from "../data/vokabeln";

import {
  type Lernstand
} from "../utils/lernSystem";

type Vokabel = {
  id: string | number;
  deutsch: string;
  spanisch: string;
  kategorie: string;
};

const LERNSTAND_KEY = "vokabel_lernstand";
const EIGENE_VOKABELN_KEY = "eigene_vokabeln";

export default function Startseite() {
  const [lernstaende, setLernstaende] = useState<
    Record<string, Lernstand>
  >({});

  const [eigeneVokabeln, setEigeneVokabeln] = useState<
    Vokabel[]
  >([]);

 const [geladen, setGeladen] = useState(true);



  const alleKarten = useMemo<Vokabel[]>(() => {
    return [
      ...(alleVokabeln as Vokabel[]),
      ...eigeneVokabeln,
    ];
  }, [eigeneVokabeln]);

  const heuteZuLernen = useMemo(() => {
    const jetzt = Date.now();

    return alleKarten.filter((karte) => {
      const status =
        lernstaende[String(karte.id)];

      if (!status) {
        return true;
      }

      return (
        status.naechsteWiederholung <= jetzt
      );
    }).length;
  }, [alleKarten, lernstaende]);

  const beherrscht = useMemo(() => {
    return alleKarten.filter((karte) => {
      const status =
        lernstaende[String(karte.id)];

      return status?.stufe === 3;
    }).length;
  }, [alleKarten, lernstaende]);

  const gelernt = useMemo(() => {
    return alleKarten.filter((karte) => {
      const status =
        lernstaende[String(karte.id)];

      return (
        status &&
        status.richtig > 0
      );
    }).length;
  }, [alleKarten, lernstaende]);

  const gesamt = alleKarten.length;

  const gesamtFortschritt =
    gesamt > 0
      ? Math.round(
          (beherrscht / gesamt) * 100
        )
      : 0;

  function kategorieFortschritt(
    kategorieId: string
  ) {
    const karten = alleKarten.filter(
      (karte) =>
        String(karte.kategorie) ===
        String(kategorieId)
    );

    if (karten.length === 0) {
      return 0;
    }

    const geschafft = karten.filter(
      (karte) => {
        const status =
          lernstaende[
            String(karte.id)
          ];

        return status?.stufe === 3;
      }
    ).length;

    return Math.round(
      (geschafft / karten.length) * 100
    );
  }

  if (!geladen) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <Text
          style={styles.loadingText}
        >
          Spanisch wird geladen...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text
            style={styles.smallTitle}
          >
            ¡Hola! 👋
          </Text>

          <Text style={styles.title}>
            Spanisch lernen 🇪🇸
          </Text>
        </View>

        <View style={styles.logo}>
          <Text
            style={styles.logoText}
          >
            🇪🇸
          </Text>
        </View>
      </View>

      {/* HEUTE */}

      <View style={styles.todayCard}>
        <View style={styles.todayLeft}>
          <Text
            style={styles.todayLabel}
          >
            HEUTE
          </Text>

          <Text
            style={styles.todayNumber}
          >
            {heuteZuLernen}
          </Text>

          <Text
            style={styles.todayText}
          >
            {heuteZuLernen === 1
              ? "Vokabel zu lernen"
              : "Vokabeln zu lernen"}
          </Text>
        </View>

        <View style={styles.todayIcon}>
          <Text
            style={styles.todayEmoji}
          >
            🧠
          </Text>
        </View>
      </View>

      {/* LERNEN BUTTON */}

      <Pressable
        style={styles.learnButton}
        onPress={() =>
          router.push({
            pathname: "/vokabeln",
            params: {
              kategorie: "alle",
              lernen: "true",
            },
          })
        }
      >
        <Text
          style={
            styles.learnButtonEmoji
          }
        >
          🃏
        </Text>

        <View
          style={
            styles.learnButtonCenter
          }
        >
          <Text
            style={
              styles.learnButtonTitle
            }
          >
            Vokabeln lernen
          </Text>

          <Text
            style={
              styles.learnButtonSubtitle
            }
          >
            Starte deine nächste
            Lernrunde
          </Text>
        </View>

        <Text style={styles.arrow}>
          ›
        </Text>
      </Pressable>

      {/* GESAMTFORTSCHRITT */}

      <View
        style={styles.sectionHeader}
      >
        <Text
          style={styles.sectionTitle}
        >
          Dein Fortschritt
        </Text>
      </View>

      <View
        style={styles.progressCard}
      >
        <View style={styles.progressTop}>
          <View>
            <Text
              style={styles.progressTitle}
            >
              {gesamtFortschritt}% beherrscht
            </Text>

            <Text
              style={
                styles.progressSubtitle
              }
            >
              {beherrscht} von {gesamt}{" "}
              Vokabeln
            </Text>
          </View>

          <Text
            style={styles.progressEmoji}
          >
            🏆
          </Text>
        </View>

        <View
          style={
            styles.progressBackground
          }
        >
          <View
            style={[
              styles.progressFill,
              {
                width:
                  `${gesamtFortschritt}%`,
              },
            ]}
          />
        </View>

        <View
          style={styles.statsRow}
        >
          <View style={styles.stat}>
            <Text
              style={styles.statNumber}
            >
              {gesamt}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Gesamt
            </Text>
          </View>

          <View style={styles.stat}>
            <Text
              style={styles.statNumber}
            >
              {gelernt}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Angefangen
            </Text>
          </View>

          <View style={styles.stat}>
            <Text
              style={styles.statNumber}
            >
              {beherrscht}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Beherrscht
            </Text>
          </View>
        </View>
      </View>

      {/* KATEGORIEN */}

      <View
        style={styles.sectionHeader}
      >
        <Text
          style={styles.sectionTitle}
        >
          Kategorien
        </Text>

        <Text
          style={styles.sectionCount}
        >
          {kategorien.length}
        </Text>
      </View>

      <View
        style={styles.categories}
      >
        {kategorien.map((kategorie) => {
          const fortschritt =
            kategorieFortschritt(
              String(kategorie.id)
            );

          const anzahl =
            alleKarten.filter(
              (karte) =>
                String(
                  karte.kategorie
                ) ===
                String(kategorie.id)
            ).length;

          return (
            <Pressable
              key={String(
                kategorie.id
              )}
              style={
                styles.categoryCard
              }
              onPress={() =>
                router.push({
                  pathname:
                    "/vokabeln",
                  params: {
                    kategorie:
                      String(
                        kategorie.id
                      ),
                    lernen: "true",
                  },
                })
              }
            >
              <View
                style={
                  styles.categoryTop
                }
              >
                <View
                  style={
                    styles.categoryIcon
                  }
                >
                  <Text
                    style={
                      styles.categoryEmoji
                    }
                  >
                    {kategorie.emoji}
                  </Text>
                </View>

                <View
                  style={
                    styles.categoryInfo
                  }
                >
                  <Text
                    style={
                      styles.categoryName
                    }
                  >
                    {kategorie.name}
                  </Text>

                  <Text
                    style={
                      styles.categoryCount
                    }
                  >
                    {anzahl}{" "}
                    {anzahl === 1
                      ? "Vokabel"
                      : "Vokabeln"}
                  </Text>
                </View>

                <Text
                  style={
                    styles.categoryPercent
                  }
                >
                  {fortschritt}%
                </Text>
              </View>

              <View
                style={
                  styles.categoryProgressBackground
                }
              >
                <View
                  style={[
                    styles.categoryProgressFill,
                    {
                      width:
                        `${fortschritt}%`,
                    },
                  ]}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ALLE VOKABELN */}

      <Pressable
        style={styles.allButton}
        onPress={() =>
          router.push({
            pathname: "/vokabeln",
            params: {
              kategorie: "alle",
              lernen: "true",
            },
          })
        }
      >
        <Text
          style={styles.allButtonEmoji}
        >
          📚
        </Text>

        <Text
          style={styles.allButtonText}
        >
          Alle Vokabeln lernen
        </Text>

        <Text
          style={styles.arrowDark}
        >
          ›
        </Text>
      </Pressable>

      {/* EIGENE VOKABELN */}

      <Pressable
        style={styles.addButton}
        onPress={() =>
          router.push("/vokabeln")
        }
      >
        <Text
          style={styles.addButtonEmoji}
        >
          ＋
        </Text>

        <View
          style={
            styles.addButtonCenter
          }
        >
          <Text
            style={
              styles.addButtonTitle
            }
          >
            Eigene Vokabel hinzufügen
          </Text>

          <Text
            style={
              styles.addButtonSubtitle
            }
          >
            Füge deine eigenen Wörter
            hinzu
          </Text>
        </View>

        <Text
          style={styles.arrowDark}
        >
          ›
        </Text>
      </Pressable>

      {/* KATEGORIEN VERWALTEN */}

      <Pressable
        style={
          styles.categoryManageButton
        }
        onPress={() =>
          router.push("/kategorien")
        }
      >
        <Text
          style={
            styles.categoryManageEmoji
          }
        >
          📂
        </Text>

        <View
          style={
            styles.categoryManageCenter
          }
        >
          <Text
            style={
              styles.categoryManageTitle
            }
          >
            Kategorien verwalten
          </Text>

          <Text
            style={
              styles.categoryManageSubtitle
            }
          >
            Eigene Kategorien hinzufügen
            und verwalten
          </Text>
        </View>

        <Text
          style={styles.arrowDark}
        >
          ›
        </Text>
      </Pressable>

      <Text style={styles.footer}>
        Viel Erfolg beim Lernen! 🇪🇸
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },

  loadingText: {
    fontSize: 17,
    color: "#555",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  smallTitle: {
    fontSize: 15,
    color: "#777",
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111",
  },

  logo: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  logoText: {
    fontSize: 30,
  },

  todayCard: {
    backgroundColor: "#111",
    borderRadius: 24,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  todayLeft: {
    flex: 1,
  },

  todayLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },

  todayNumber: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "900",
    marginTop: 2,
  },

  todayText: {
    color: "#ccc",
    fontSize: 15,
  },

  todayIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: "#2b2b2b",
    justifyContent: "center",
    alignItems: "center",
  },

  todayEmoji: {
    fontSize: 35,
  },

  learnButton: {
    backgroundColor: "#2e9d50",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  learnButtonEmoji: {
    fontSize: 27,
    marginRight: 13,
  },

  learnButtonCenter: {
    flex: 1,
  },

  learnButtonTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  learnButtonSubtitle: {
    color: "#dcefe1",
    fontSize: 12,
    marginTop: 3,
  },

  arrow: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    flex: 1,
  },

  sectionCount: {
    backgroundColor: "#e8e8e8",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: "700",
  },

  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    marginBottom: 28,
  },

  progressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressTitle: {
    fontSize: 20,
    fontWeight: "800",
  },

  progressSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 3,
  },

  progressEmoji: {
    fontSize: 30,
  },

  progressBackground: {
    height: 9,
    backgroundColor: "#e7e7e7",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 18,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2e9d50",
    borderRadius: 5,
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 20,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "800",
  },

  statLabel: {
    color: "#888",
    fontSize: 11,
    marginTop: 3,
  },

  categories: {
    gap: 10,
    marginBottom: 18,
  },

  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
  },

  categoryTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  categoryEmoji: {
    fontSize: 25,
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "800",
  },

  categoryCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },

  categoryPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: "#555",
  },

  categoryProgressBackground: {
    height: 7,
    backgroundColor: "#e8e8e8",
    borderRadius: 4,
    overflow: "hidden",
  },

  categoryProgressFill: {
    height: "100%",
    backgroundColor: "#2e9d50",
    borderRadius: 4,
  },

  allButton: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  allButtonEmoji: {
    fontSize: 24,
    marginRight: 13,
  },

  allButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },

  arrowDark: {
    fontSize: 28,
    color: "#555",
  },

  addButton: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  addButtonEmoji: {
    fontSize: 25,
    marginRight: 13,
  },

  addButtonCenter: {
    flex: 1,
  },

  addButtonTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  addButtonSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 3,
  },

  categoryManageButton: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  categoryManageEmoji: {
    fontSize: 25,
    marginRight: 13,
  },

  categoryManageCenter: {
    flex: 1,
  },

  categoryManageTitle: {
    fontSize: 16,
    fontWeight: "800",
  },

  categoryManageSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 3,
  },

  footer: {
    textAlign: "center",
    color: "#aaa",
    fontSize: 12,
    marginTop: 25,
  },
});