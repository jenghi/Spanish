import * as Speicher from "../utils/speicher";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Kategorie = {
  id: string;
  name: string;
  emoji: string;
  eigene?: boolean;
};

type Vokabel = {
  id: string | number;
  deutsch: string;
  spanisch: string;
  kategorie: string;
};

const KATEGORIEN_KEY = "eigene_kategorien";
const VOKABELN_KEY = "eigene_vokabeln";

const BASIS_KATEGORIEN: Kategorie[] = [
  {
    id: "alltag",
    name: "Alltag",
    emoji: "🏠",
  },
  {
    id: "essen",
    name: "Essen",
    emoji: "🍎",
  },
  {
    id: "reisen",
    name: "Reisen",
    emoji: "✈️",
  },
  {
    id: "familie",
    name: "Familie",
    emoji: "👨‍👩‍👧",
  },
  {
    id: "schule",
    name: "Schule",
    emoji: "🏫",
  },
];

const EMOJIS = [
  "📚",
  "🎯",
  "⭐",
  "❤️",
  "😊",
  "🧠",
  "💡",
  "🎓",
  "🌎",
  "🇪🇸",
  "🏠",
  "🍎",
  "✈️",
  "👨‍👩‍👧",
  "🏫",
  "⚽",
  "🎵",
  "🎨",
  "💼",
  "🌴",
];

type Meldung = {
  sichtbar: boolean;
  titel: string;
  text: string;
  bestaetigen?: boolean;
  kategorie?: Kategorie;
};

export default function KategorienScreen() {
  const router = useRouter();

  const [kategorien, setKategorien] = useState<Kategorie[]>([]);
  const [vokabeln, setVokabeln] = useState<Vokabel[]>([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [bearbeitenId, setBearbeitenId] = useState<string | null>(
    null
  );

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📚");

  const [meldung, setMeldung] = useState<Meldung>({
    sichtbar: false,
    titel: "",
    text: "",
  });

  // ============================================================
  // DATEN LADEN
  // ============================================================

  const datenLaden = useCallback(async () => {
    try {
      const kategorienData =
        await Speicher.getItem(KATEGORIEN_KEY);

      const vokabelnData =
        await Speicher.getItem(VOKABELN_KEY);

      let geladeneKategorien: Kategorie[] = [];
      let geladeneVokabeln: Vokabel[] = [];

      // Kategorien laden
      if (kategorienData) {
        try {
          const parsed = JSON.parse(kategorienData);

          if (Array.isArray(parsed)) {
            geladeneKategorien = parsed.filter(
              (item) =>
                item &&
                typeof item === "object" &&
                typeof item.id !== "undefined" &&
                typeof item.name === "string"
            );
          }
        } catch (error) {
          console.log(
            "Fehler beim Lesen der Kategorien:",
            error
          );
        }
      }

      // Vokabeln laden
      if (vokabelnData) {
        try {
          const parsed = JSON.parse(vokabelnData);

          if (Array.isArray(parsed)) {
            geladeneVokabeln = parsed.filter(
              (item) =>
                item &&
                typeof item === "object" &&
                typeof item.kategorie !== "undefined"
            );
          }
        } catch (error) {
          console.log(
            "Fehler beim Lesen der Vokabeln:",
            error
          );
        }
      }

      setKategorien(geladeneKategorien);
      setVokabeln(geladeneVokabeln);

      console.log(
        "Kategorien geladen:",
        geladeneKategorien.length
      );

      console.log(
        "Vokabeln geladen:",
        geladeneVokabeln.length
      );
    } catch (error) {
      console.log("Fehler beim Laden:", error);
    }
  }, []);

  // Seite jedes Mal neu laden, wenn sie geöffnet wird
  useFocusEffect(
    useCallback(() => {
      datenLaden();
    }, [datenLaden])
  );

  // ============================================================
  // VOKABELANZAHL
  // ============================================================

  function vokabelAnzahl(kategorieId: string) {
    return vokabeln.filter(
      (vokabel) =>
        String(vokabel.kategorie) ===
        String(kategorieId)
    ).length;
  }

  // ============================================================
  // NEUE KATEGORIE
  // ============================================================

  function neueKategorie() {
    setBearbeitenId(null);
    setName("");
    setEmoji("📚");
    setModalVisible(true);
  }

  // ============================================================
  // KATEGORIE BEARBEITEN
  // ============================================================

  function bearbeiten(kategorie: Kategorie) {
    setBearbeitenId(kategorie.id);
    setName(kategorie.name);
    setEmoji(kategorie.emoji);
    setModalVisible(true);
  }

  // ============================================================
  // KATEGORIE SPEICHERN
  // ============================================================

  async function speichern() {
    const neuerName = name.trim();

    if (neuerName.length === 0) {
      setMeldung({
        sichtbar: true,
        titel: "Name fehlt",
        text:
          "Bitte gib einen Namen für die Kategorie ein.",
      });

      return;
    }

    try {
      const kategorienData =
        await Speicher.getItem(KATEGORIEN_KEY);

      let aktuelleKategorien: Kategorie[] = [];

      if (kategorienData) {
        try {
          const parsed = JSON.parse(kategorienData);

          if (Array.isArray(parsed)) {
            aktuelleKategorien = parsed;
          }
        } catch (error) {
          console.log(
            "Fehler beim Lesen der Kategorien:",
            error
          );
        }
      }

      // ========================================================
      // BEARBEITEN
      // ========================================================

      if (bearbeitenId !== null) {
        const neueKategorien =
          aktuelleKategorien.map((kategorie) => {
            if (
              String(kategorie.id) ===
              String(bearbeitenId)
            ) {
              return {
                ...kategorie,
                name: neuerName,
                emoji: emoji,
              };
            }

            return kategorie;
          });

        await Speicher.setItem(
          KATEGORIEN_KEY,
          JSON.stringify(neueKategorien)
        );

        setKategorien(neueKategorien);
        setModalVisible(false);

        setMeldung({
          sichtbar: true,
          titel: "Gespeichert",
          text:
            `Die Kategorie „${neuerName}“ ` +
            `wurde geändert.`,
        });

        return;
      }

      // ========================================================
      // NEUE KATEGORIE
      // ========================================================

      const neueKategorie: Kategorie = {
        id: `custom_${Date.now()}`,
        name: neuerName,
        emoji: emoji,
        eigene: true,
      };

      const neueKategorien = [
        ...aktuelleKategorien,
        neueKategorie,
      ];

      await Speicher.setItem(
        KATEGORIEN_KEY,
        JSON.stringify(neueKategorien)
      );

      setKategorien(neueKategorien);

      setName("");
      setEmoji("📚");
      setModalVisible(false);

      setMeldung({
        sichtbar: true,
        titel: "Kategorie erstellt",
        text:
          `Die Kategorie „${neuerName}“ ` +
          `wurde erstellt.`,
      });
    } catch (error) {
      console.log(
        "Fehler beim Speichern:",
        error
      );

      setMeldung({
        sichtbar: true,
        titel: "Fehler",
        text:
          "Die Kategorie konnte nicht gespeichert werden.",
      });
    }
  }

  // ============================================================
  // KATEGORIE LÖSCHEN - PRÜFUNG
  // ============================================================

  async function loeschen(kategorie: Kategorie) {
    console.log(
      "Löschen gedrückt:",
      kategorie.name,
      kategorie.id
    );

    // ----------------------------------------------------------
    // STANDARDKATEGORIE SCHÜTZEN
    // ----------------------------------------------------------

    const istStandard =
      BASIS_KATEGORIEN.some(
        (basis) =>
          String(basis.id) ===
          String(kategorie.id)
      );

    if (istStandard) {
      setMeldung({
        sichtbar: true,
        titel: "Nicht möglich",
        text:
          "Eine Standardkategorie kann nicht gelöscht werden.",
      });

      return;
    }

    // ----------------------------------------------------------
    // VOKABELN DIREKT AUS ASYNCSTORAGE LADEN
    // ----------------------------------------------------------

    let aktuelleVokabeln: Vokabel[] = [];

    try {
      const gespeicherteVokabeln =
        await Speicher.getItem(VOKABELN_KEY);

      if (gespeicherteVokabeln) {
        const parsed = JSON.parse(
          gespeicherteVokabeln
        );

        if (Array.isArray(parsed)) {
          aktuelleVokabeln = parsed.filter(
            (item) =>
              item &&
              typeof item === "object" &&
              typeof item.kategorie !== "undefined"
          );
        }
      }
    } catch (error) {
      console.log(
        "Fehler beim Lesen der Vokabeln:",
        error
      );
    }

    // State aktualisieren
    setVokabeln(aktuelleVokabeln);

    // ----------------------------------------------------------
    // VOKABELN FÜR DIESE KATEGORIE ZÄHLEN
    // ----------------------------------------------------------

    const anzahl =
      aktuelleVokabeln.filter(
        (vokabel) =>
          String(vokabel.kategorie) ===
          String(kategorie.id)
      ).length;

    console.log(
      "Kategorie:",
      kategorie.name
    );

    console.log(
      "ID:",
      kategorie.id
    );

    console.log(
      "Vokabeln:",
      anzahl
    );

    // ----------------------------------------------------------
    // KATEGORIE HAT VOKABELN
    // ----------------------------------------------------------

    if (anzahl > 0) {
      setMeldung({
        sichtbar: true,
        titel:
          "Kategorie kann nicht gelöscht werden",
        text:
          `„${kategorie.name}“ enthält noch ${anzahl} ` +
          `${anzahl === 1 ? "Vokabel" : "Vokabeln"}.

` +
          "Bitte entferne zuerst die Vokabeln aus dieser Kategorie.",
      });

      return;
    }

    // ----------------------------------------------------------
    // KATEGORIE IST LEER
    // ----------------------------------------------------------

    setMeldung({
      sichtbar: true,
      titel: "Kategorie löschen?",
      text:
        `Möchtest du „${kategorie.name}“ ` +
        `wirklich löschen?`,
      bestaetigen: true,
      kategorie: kategorie,
    });
  }

  // ============================================================
  // LÖSCHUNG ENDGÜLTIG DURCHFÜHREN
  // ============================================================

  async function loeschungBestaetigen(
    kategorie: Kategorie
  ) {
    try {
      console.log(
        "Löschung bestätigt:",
        kategorie.name
      );

      // --------------------------------------------------------
      // VOR DEM LÖSCHEN NOCHMALS VOKABELN PRÜFEN
      // --------------------------------------------------------

      const vokabelnData =
        await Speicher.getItem(VOKABELN_KEY);

      let aktuelleVokabeln: Vokabel[] = [];

      if (vokabelnData) {
        try {
          const parsed = JSON.parse(vokabelnData);

          if (Array.isArray(parsed)) {
            aktuelleVokabeln = parsed;
          }
        } catch {
          aktuelleVokabeln = [];
        }
      }

      const anzahl =
        aktuelleVokabeln.filter(
          (vokabel) =>
            String(vokabel.kategorie) ===
            String(kategorie.id)
        ).length;

      // Sicherheitsprüfung
      if (anzahl > 0) {
        setMeldung({
          sichtbar: true,
          titel:
            "Löschen nicht möglich",
          text:
            `Die Kategorie enthält inzwischen ` +
            `${anzahl} ${
              anzahl === 1
                ? "Vokabel"
                : "Vokabeln"
            }.

` +
            "Bitte entferne diese zuerst.",
        });

        return;
      }

      // --------------------------------------------------------
      // KATEGORIEN AUS STORAGE LADEN
      // --------------------------------------------------------

      const kategorienData =
        await Speicher.getItem(
          KATEGORIEN_KEY
        );

      let aktuelleKategorien: Kategorie[] = [];

      if (kategorienData) {
        try {
          const parsed = JSON.parse(
            kategorienData
          );

          if (Array.isArray(parsed)) {
            aktuelleKategorien = parsed;
          }
        } catch {
          aktuelleKategorien = [];
        }
      }

      // --------------------------------------------------------
      // KATEGORIE ENTFERNEN
      // --------------------------------------------------------

      const verbleibendeKategorien =
        aktuelleKategorien.filter(
          (item) =>
            String(item.id) !==
            String(kategorie.id)
        );

      await Speicher.setItem(
        KATEGORIEN_KEY,
        JSON.stringify(
          verbleibendeKategorien
        )
      );

      setKategorien(
        verbleibendeKategorien
      );

      // Meldung schließen
      setMeldung({
        sichtbar: false,
        titel: "",
        text: "",
      });

      // Erfolgsmeldung
      setTimeout(() => {
        setMeldung({
          sichtbar: true,
          titel: "Gelöscht",
          text:
            `Die Kategorie „${kategorie.name}“ ` +
            `wurde gelöscht.`,
        });
      }, 100);
    } catch (error) {
      console.log(
        "Fehler beim endgültigen Löschen:",
        error
      );

      setMeldung({
        sichtbar: true,
        titel: "Fehler",
        text:
          "Die Kategorie konnte nicht gelöscht werden.",
      });
    }
  }

  // ============================================================
  // MELDUNG SCHLIESSEN
  // ============================================================

  function meldungSchliessen() {
    setMeldung({
      sichtbar: false,
      titel: "",
      text: "",
    });
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Deine Kategorien
          </Text>

          <Text style={styles.headerSubtitle}>
            Verwalte deine Lernbereiche
          </Text>
        </View>

        <View style={styles.headerSpace} />

      </View>

      {/* ======================================================
          INHALT
      ====================================================== */}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ====================================================
            NEUE KATEGORIE
        ==================================================== */}

        <Pressable
          style={({ pressed }) => [
            styles.newCategoryButton,
            pressed && styles.pressed,
          ]}
          onPress={neueKategorie}
        >
          <View style={styles.newIcon}>
            <Text style={styles.newIconText}>
              ＋
            </Text>
          </View>

          <View style={styles.newText}>
            <Text style={styles.newTitle}>
              Neue Kategorie
            </Text>

            <Text style={styles.newSubtitle}>
              Eigenen Lernbereich erstellen
            </Text>
          </View>
        </Pressable>

        {/* ====================================================
            EIGENE KATEGORIEN
        ==================================================== */}

        {kategorien.length > 0 && (
          <View style={styles.section}>

            <Text style={styles.sectionTitle}>
              Deine Kategorien
            </Text>

            {kategorien.map((kategorie) => {

              const anzahl =
                vokabelAnzahl(
                  kategorie.id
                );

              return (
                <View
                  key={String(kategorie.id)}
                  style={styles.categoryCard}
                >

                  {/* ICON */}

                  <View style={styles.emojiBox}>
                    <Text style={styles.categoryEmoji}>
                      {kategorie.emoji}
                    </Text>
                  </View>

                  {/* NAME */}

                  <View style={styles.categoryInfo}>

                    <Text
                      style={styles.categoryName}
                      numberOfLines={1}
                    >
                      {kategorie.name}
                    </Text>

                    <Text
                      style={styles.categoryCount}
                    >
                      {anzahl}{" "}
                      {anzahl === 1
                        ? "Vokabel"
                        : "Vokabeln"}
                    </Text>

                  </View>

                  {/* BEARBEITEN */}

                  <Pressable
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                    onPress={() =>
                      bearbeiten(kategorie)
                    }
                    hitSlop={10}
                  >
                    <Text
                      style={styles.editText}
                    >
                      ✏️
                    </Text>
                  </Pressable>

                  {/* LÖSCHEN */}

                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteButton,
                      pressed &&
                        styles.deletePressed,
                    ]}
                    onPress={() =>
                      loeschen(kategorie)
                    }
                    hitSlop={10}
                  >
                    <Text
                      style={styles.deleteText}
                    >
                      🗑️
                    </Text>
                  </Pressable>

                </View>
              );
            })}

          </View>
        )}

        {/* ====================================================
            STANDARDKATEGORIEN
        ==================================================== */}

        <View style={styles.section}>

          <Text style={styles.sectionTitle}>
            Standardkategorien
          </Text>

          <Text style={styles.sectionDescription}>
            Diese Kategorien sind fest eingebaut
            und können nicht gelöscht werden.
          </Text>

          {BASIS_KATEGORIEN.map(
            (kategorie) => (
              <View
                key={kategorie.id}
                style={styles.categoryCard}
              >

                <View style={styles.emojiBox}>
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
                    Standardkategorie
                  </Text>
                </View>

                <View
                  style={styles.lockButton}
                >
                  <Text
                    style={styles.lockText}
                  >
                    🔒
                  </Text>
                </View>

              </View>
            )
          )}

        </View>

        {/* ====================================================
            INFO
        ==================================================== */}

        <View style={styles.infoBox}>

          <Text style={styles.infoEmoji}>
            💡
          </Text>

          <View style={styles.infoContent}>

            <Text style={styles.infoTitle}>
              Löschen
            </Text>

            <Text style={styles.infoText}>
              Eine eigene Kategorie kann nur
              gelöscht werden, wenn sie keine
              Vokabeln enthält.
            </Text>

          </View>

        </View>

      </ScrollView>

      {/* ======================================================
          KATEGORIE ERSTELLEN / BEARBEITEN MODAL
      ====================================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modal}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                {bearbeitenId
                  ? "Kategorie bearbeiten"
                  : "Neue Kategorie"}
              </Text>

              <Pressable
                style={styles.closeButton}
                onPress={() =>
                  setModalVisible(false)
                }
              >
                <Text
                  style={styles.closeText}
                >
                  ×
                </Text>
              </Pressable>

            </View>

            {/* NAME */}

            <Text style={styles.label}>
              Name
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="z. B. Fragewörter"
              placeholderTextColor="#999"
              maxLength={40}
            />

            {/* EMOJI */}

            <Text style={styles.label}>
              Symbol
            </Text>

            <View style={styles.emojiGrid}>

              {EMOJIS.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.emojiChoice,
                    emoji === item &&
                      styles.emojiChoiceSelected,
                  ]}
                  onPress={() =>
                    setEmoji(item)
                  }
                >
                  <Text
                    style={
                      styles.choiceText
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}

            </View>

            {/* SPEICHERN */}

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={speichern}
            >
              <Text
                style={styles.saveText}
              >
                {bearbeitenId
                  ? "Speichern"
                  : "Kategorie erstellen"}
              </Text>
            </Pressable>

            {/* ABBRECHEN */}

            <Pressable
              style={styles.cancelButton}
              onPress={() =>
                setModalVisible(false)
              }
            >
              <Text
                style={styles.cancelText}
              >
                Abbrechen
              </Text>
            </Pressable>

          </View>

        </View>

      </Modal>

      {/* ======================================================
          EIGENES MELDUNGS-MODAL
      ====================================================== */}

      <Modal
        visible={meldung.sichtbar}
        transparent
        animationType="fade"
        onRequestClose={
          meldungSchliessen
        }
      >

        <View style={styles.messageOverlay}>

          <View style={styles.messageBox}>

            <Text
              style={styles.messageTitle}
            >
              {meldung.titel}
            </Text>

            <Text
              style={styles.messageText}
            >
              {meldung.text}
            </Text>

            {/* LÖSCHBESTÄTIGUNG */}

            {meldung.bestaetigen &&
            meldung.kategorie ? (

              <View
                style={
                  styles.messageButtons
                }
              >

                <Pressable
                  style={
                    styles.messageCancel
                  }
                  onPress={
                    meldungSchliessen
                  }
                >
                  <Text
                    style={
                      styles.messageCancelText
                    }
                  >
                    Abbrechen
                  </Text>
                </Pressable>

                <Pressable
                  style={
                    styles.messageDelete
                  }
                  onPress={() =>
                    loeschungBestaetigen(
                      meldung.kategorie!
                    )
                  }
                >
                  <Text
                    style={
                      styles.messageDeleteText
                    }
                  >
                    Löschen
                  </Text>
                </Pressable>

              </View>

            ) : (

              <Pressable
                style={styles.messageOk}
                onPress={
                  meldungSchliessen
                }
              >
                <Text
                  style={styles.messageOkText}
                >
                  OK
                </Text>
              </Pressable>

            )}

          </View>

        </View>

      </Modal>

    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fc",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 76,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f0f1f5",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 34,
    color: "#222222",
    lineHeight: 38,
    marginTop: -3,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#181818",
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#888888",
    marginTop: 2,
  },

  headerSpace: {
    width: 44,
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    padding: 16,
    paddingBottom: 50,
  },

  // ==========================================================
  // NEUE KATEGORIE
  // ==========================================================

  newCategoryButton: {
    height: 76,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 24,
  },

  newIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#e9f7ee",
    alignItems: "center",
    justifyContent: "center",
  },

  newIconText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2e9b55",
  },

  newText: {
    marginLeft: 14,
    flex: 1,
  },

  newTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#181818",
  },

  newSubtitle: {
    fontSize: 12,
    color: "#888888",
    marginTop: 4,
  },

  // ==========================================================
  // SECTIONS
  // ==========================================================

  section: {
    marginBottom: 26,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#181818",
    marginBottom: 10,
  },

  sectionDescription: {
    fontSize: 13,
    color: "#888888",
    lineHeight: 19,
    marginBottom: 12,
  },

  // ==========================================================
  // KATEGORIEN
  // ==========================================================

  categoryCard: {
    minHeight: 76,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
  },

  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#f3f4f8",
    justifyContent: "center",
    alignItems: "center",
  },

  categoryEmoji: {
    fontSize: 27,
  },

  categoryInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#181818",
  },

  categoryCount: {
    fontSize: 12,
    color: "#888888",
    marginTop: 4,
  },

  // ==========================================================
  // BUTTONS
  // ==========================================================

  editButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#eef3ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  editText: {
    fontSize: 20,
  },

  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ffe5e5",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteText: {
    fontSize: 20,
  },

  deletePressed: {
    backgroundColor: "#ffcaca",
  },

  buttonPressed: {
    opacity: 0.7,
  },

  lockButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#eeeeee",
    alignItems: "center",
    justifyContent: "center",
  },

  lockText: {
    fontSize: 18,
    opacity: 0.6,
  },

  // ==========================================================
  // INFO
  // ==========================================================

  infoBox: {
    backgroundColor: "#fffdf0",
    borderWidth: 1,
    borderColor: "#eee5b9",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
  },

  infoEmoji: {
    fontSize: 21,
    marginRight: 10,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#514b2e",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 12,
    color: "#6d6748",
    lineHeight: 18,
  },

  // ==========================================================
  // KATEGORIE-MODAL
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 30,
    maxHeight: "90%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#181818",
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f0f1f4",
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 28,
    color: "#555555",
    marginTop: -3,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#333333",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dddddd",
    backgroundColor: "#fafafa",
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#181818",
    marginBottom: 20,
  },

  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },

  emojiChoice: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#f2f3f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },

  emojiChoiceSelected: {
    borderColor: "#333333",
    backgroundColor: "#ffffff",
  },

  choiceText: {
    fontSize: 23,
  },

  saveButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: "#2e9b55",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  saveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  cancelButton: {
    height: 50,
    borderRadius: 15,
    backgroundColor: "#f0f1f4",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: "#444444",
    fontSize: 15,
    fontWeight: "700",
  },

  // ==========================================================
  // MELDUNGS-MODAL
  // ==========================================================

  messageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  messageBox: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 24,
  },

  messageTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#181818",
    marginBottom: 10,
  },

  messageText: {
    fontSize: 15,
    color: "#555555",
    lineHeight: 22,
    marginBottom: 22,
  },

  messageButtons: {
    flexDirection: "row",
    gap: 10,
  },

  messageCancel: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#f0f1f4",
    alignItems: "center",
    justifyContent: "center",
  },

  messageCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444444",
  },

  messageDelete: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#e53935",
    alignItems: "center",
    justifyContent: "center",
  },

  messageDeleteText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },

  messageOk: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#2e9b55",
    alignItems: "center",
    justifyContent: "center",
  },

  messageOkText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },

  pressed: {
    opacity: 0.7,
  },
});