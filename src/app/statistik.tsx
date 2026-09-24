import * as Speicher from "../utils/speicher";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

const STORAGE_KEY = "vokabel_lernstand";

type LernstandEintrag = {
  stufe: number;
  richtig: number;
  falsch: number;
  naechsteWiederholung: number;
};

type Lernstand = {
  [vokabelId: string]: LernstandEintrag;
};

const STUFEN = {
  NEU: 0,
  LERNT: 1,
  GELERNT: 2,
  SEHR_GUT: 3,
};

export default function StatistikScreen() {
  const [lernstand, setLernstand] =
    useState<Lernstand>({});

  const [geladen, setGeladen] =
    useState(false);

  const laden = useCallback(
    async () => {
      try {
        const gespeichert =
          await Speicher.getItem(
            STORAGE_KEY
          );

        if (gespeichert) {
          setLernstand(
            JSON.parse(gespeichert)
          );
        } else {
          setLernstand({});
        }
      } catch (error) {
        console.log(
          "Fehler beim Laden:",
          error
        );
      }

      setGeladen(true);
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      laden();
    }, [laden])
  );

  if (!geladen) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>
          Statistik wird geladen...
        </Text>
      </View>
    );
  }

  const jetzt = Date.now();

  /*
   * Gesamtstatistik
   */

  const gesamt =
    alleVokabeln.length;

  const neu =
    alleVokabeln.filter((vokabel) => {
      const status =
        lernstand[
          String(vokabel.id)
        ];

      return (
        !status ||
        status.stufe === STUFEN.NEU
      );
    }).length;

  const lernt =
    alleVokabeln.filter((vokabel) => {
      const status =
        lernstand[
          String(vokabel.id)
        ];

      return (
        status &&
        status.stufe === STUFEN.LERNT
      );
    }).length;

  const gelernt =
    alleVokabeln.filter((vokabel) => {
      const status =
        lernstand[
          String(vokabel.id)
        ];

      return (
        status &&
        status.stufe === STUFEN.GELERNT
      );
    }).length;

  const sehrGut =
    alleVokabeln.filter((vokabel) => {
      const status =
        lernstand[
          String(vokabel.id)
        ];

      return (
        status &&
        status.stufe ===
          STUFEN.SEHR_GUT
      );
    }).length;

  const faellig =
    alleVokabeln.filter((vokabel) => {
      const status =
        lernstand[
          String(vokabel.id)
        ];

      if (!status) {
        return true;
      }

      return (
        status.naechsteWiederholung <=
        jetzt
      );
    }).length;

  /*
   * Antworten zählen
   */

  let richtig = 0;
  let falsch = 0;

  Object.values(lernstand).forEach(
    (status) => {
      richtig += status.richtig;
      falsch += status.falsch;
    }
  );

  const antworten =
    richtig + falsch;

  const trefferquote =
    antworten > 0
      ? Math.round(
          (richtig / antworten) *
            100
        )
      : 0;

  const lernfortschritt =
    gesamt > 0
      ? Math.round(
          ((gelernt + sehrGut) /
            gesamt) *
            100
        )
      : 0;

  /*
   * Kategorie-Daten
   */

  function kategorieDaten(
    kategorieId: string
  ) {
    const vokabeln =
      alleVokabeln.filter(
        (vokabel) =>
          vokabel.kategorie ===
          kategorieId
      );

    const gelernt =
      vokabeln.filter((vokabel) => {
        const status =
          lernstand[
            String(vokabel.id)
          ];

        return (
          status &&
          status.stufe >=
            STUFEN.GELERNT
        );
      }).length;

    const faellig =
      vokabeln.filter((vokabel) => {
        const status =
          lernstand[
            String(vokabel.id)
          ];

        if (!status) {
          return true;
        }

        return (
          status.naechsteWiederholung <=
          jetzt
        );
      }).length;

    const prozent =
      vokabeln.length > 0
        ? Math.round(
            (gelernt /
              vokabeln.length) *
              100
          )
        : 0;

    return {
      gesamt: vokabeln.length,
      gelernt,
      faellig,
      prozent,
    };
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      {/* Zurück */}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          ← Zurück
        </Text>
      </Pressable>

      {/* Titel */}

      <Text style={styles.title}>
        📊 Statistik
      </Text>

      <Text style={styles.subtitle}>
        Dein aktueller Lernfortschritt
      </Text>

      {/* Hauptfortschritt */}

      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>
          🇪🇸
        </Text>

        <Text style={styles.heroPercent}>
          {lernfortschritt}%
        </Text>

        <Text style={styles.heroText}>
          deiner Vokabeln gelernt
        </Text>

        <View
          style={
            styles.heroProgressBackground
          }
        >
          <View
            style={[
              styles.heroProgress,
              {
                width: `${lernfortschritt}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Kartenstatus */}

      <Text style={styles.sectionTitle}>
        Vokabelstatus
      </Text>

      <View style={styles.grid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>
            🆕
          </Text>

          <Text style={styles.infoNumber}>
            {neu}
          </Text>

          <Text style={styles.infoLabel}>
            Neu
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>
            🟡
          </Text>

          <Text style={styles.infoNumber}>
            {lernt}
          </Text>

          <Text style={styles.infoLabel}>
            Lernt
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>
            🟢
          </Text>

          <Text style={styles.infoNumber}>
            {gelernt}
          </Text>

          <Text style={styles.infoLabel}>
            Gelernt
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>
            ⭐
          </Text>

          <Text style={styles.infoNumber}>
            {sehrGut}
          </Text>

          <Text style={styles.infoLabel}>
            Sehr gut
          </Text>
        </View>
      </View>

      {/* Wiederholungen */}

      <View style={styles.dueCard}>
        <View>
          <Text style={styles.dueTitle}>
            ⏰ Wiederholungen
          </Text>

          <Text style={styles.dueSubtitle}>
            Aktuell fällige Vokabeln
          </Text>
        </View>

        <Text style={styles.dueNumber}>
          {faellig}
        </Text>
      </View>

      {/* Antworten */}

      <Text style={styles.sectionTitle}>
        Antworten
      </Text>

      <View style={styles.answerCard}>
        <View style={styles.answerRow}>
          <Text style={styles.answerLabel}>
            Richtig
          </Text>

          <Text style={styles.correctText}>
            {richtig}
          </Text>
        </View>

        <View style={styles.answerRow}>
          <Text style={styles.answerLabel}>
            Falsch
          </Text>

          <Text style={styles.wrongText}>
            {falsch}
          </Text>
        </View>

        <View style={styles.answerRow}>
          <Text style={styles.answerLabel}>
            Gesamt
          </Text>

          <Text style={styles.totalText}>
            {antworten}
          </Text>
        </View>

        <View
          style={
            styles.answerDivider
          }
        />

        <View style={styles.answerRow}>
          <Text style={styles.answerLabel}>
            Trefferquote
          </Text>

          <Text style={styles.accuracy}>
            {trefferquote}%
          </Text>
        </View>
      </View>

      {/* Kategorien */}

      <Text style={styles.sectionTitle}>
        Fortschritt nach Kategorie
      </Text>

      {kategorien.map((kategorie) => {
        const daten =
          kategorieDaten(
            kategorie.id
          );

        return (
          <View
            key={kategorie.id}
            style={styles.categoryCard}
          >
            <View
              style={
                styles.categoryTop
              }
            >
              <View
                style={
                  styles.categoryNameContainer
                }
              >
                <Text
                  style={
                    styles.categoryEmoji
                  }
                >
                  {kategorie.emoji}
                </Text>

                <Text
                  style={
                    styles.categoryName
                  }
                >
                  {kategorie.name}
                </Text>
              </View>

              <Text
                style={
                  styles.categoryPercent
                }
              >
                {daten.prozent}%
              </Text>
            </View>

            <View
              style={
                styles.categoryProgressBackground
              }
            >
              <View
                style={[
                  styles.categoryProgress,
                  {
                    width: `${daten.prozent}%`,
                  },
                ]}
              />
            </View>

            <View
              style={
                styles.categoryBottom
              }
            >
              <Text
                style={
                  styles.categoryInfo
                }
              >
                {daten.gelernt}/
                {daten.gesamt} gelernt
              </Text>

              {daten.faellig > 0 && (
                <Text
                  style={
                    styles.categoryDue
                  }
                >
                  {daten.faellig} fällig
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {/* Gesamtzahl */}

      <View style={styles.footerCard}>
        <Text style={styles.footerText}>
          📚 {gesamt} Vokabeln insgesamt
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: "#ffffff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  loading: {
    fontSize: 18,
  },

  backButton: {
    marginBottom: 18,
  },

  backText: {
    fontSize: 17,
    color: "#555555",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 16,
    color: "#777777",
    marginTop: 5,
    marginBottom: 22,
  },

  heroCard: {
    backgroundColor: "#f3f3f3",
    borderRadius: 22,
    padding: 25,
    alignItems: "center",
    marginBottom: 25,
  },

  heroEmoji: {
    fontSize: 42,
    marginBottom: 5,
  },

  heroPercent: {
    fontSize: 48,
    fontWeight: "800",
  },

  heroText: {
    fontSize: 15,
    color: "#777777",
    marginBottom: 20,
  },

  heroProgressBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#dddddd",
    borderRadius: 5,
    overflow: "hidden",
  },

  heroProgress: {
    height: "100%",
    backgroundColor: "#2e9d50",
    borderRadius: 5,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  infoCard: {
    width: "48%",
    backgroundColor: "#f3f3f3",
    borderRadius: 18,
    padding: 17,
    alignItems: "center",
  },

  infoEmoji: {
    fontSize: 25,
    marginBottom: 5,
  },

  infoNumber: {
    fontSize: 25,
    fontWeight: "800",
  },

  infoLabel: {
    color: "#777777",
    fontSize: 13,
    marginTop: 3,
  },

  dueCard: {
    backgroundColor: "#fff4dc",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  dueTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  dueSubtitle: {
    color: "#888888",
    fontSize: 13,
    marginTop: 3,
  },

  dueNumber: {
    fontSize: 32,
    fontWeight: "800",
  },

  answerCard: {
    backgroundColor: "#f3f3f3",
    borderRadius: 18,
    padding: 18,
    marginBottom: 25,
  },

  answerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },

  answerLabel: {
    fontSize: 15,
    color: "#666666",
  },

  correctText: {
    fontSize: 18,
    fontWeight: "800",
  },

  wrongText: {
    fontSize: 18,
    fontWeight: "800",
  },

  totalText: {
    fontSize: 18,
    fontWeight: "800",
  },

  accuracy: {
    fontSize: 22,
    fontWeight: "800",
  },

  answerDivider: {
    height: 1,
    backgroundColor: "#dddddd",
    marginVertical: 7,
  },

  categoryCard: {
    backgroundColor: "#f3f3f3",
    borderRadius: 18,
    padding: 17,
    marginBottom: 12,
  },

  categoryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  categoryNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryEmoji: {
    fontSize: 25,
    marginRight: 10,
  },

  categoryName: {
    fontSize: 17,
    fontWeight: "700",
  },

  categoryPercent: {
    fontSize: 18,
    fontWeight: "800",
  },

  categoryProgressBackground: {
    height: 8,
    backgroundColor: "#dddddd",
    borderRadius: 4,
    overflow: "hidden",
  },

  categoryProgress: {
    height: "100%",
    backgroundColor: "#2e9d50",
    borderRadius: 4,
  },

  categoryBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  categoryInfo: {
    fontSize: 12,
    color: "#777777",
  },

  categoryDue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#c47c00",
  },

  footerCard: {
    marginTop: 10,
    alignItems: "center",
    padding: 15,
  },

  footerText: {
    color: "#888888",
    fontSize: 14,
  },
});