import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  alleVokabeln,
  kategorien as standardKategorien,
} from "../data/vokabeln";
import {
  neuerLernstand,
  normalisiereLernstand,
  waehleLernkarten,
  type Lernstand,
} from "../utils/lernSystem";

type Vokabel = {
  id: number;
  deutsch: string;
  spanisch: string;
  kategorie: string;
};


type Kategorie = {
  id: string;
  name: string;
  emoji?: string;
};

type Ansicht = "verwaltung" | "lernen";
type LernModus = "deutsch" | "spanisch";

const LERNSTAND_KEY = "vokabel_lernstand";
const EIGENE_VOKABELN_KEY = "eigene_vokabeln";
const EIGENE_KATEGORIEN_KEY = "eigene_kategorien";

export default function VokabelnScreen() {
  const [ansicht, setAnsicht] =
    useState<Ansicht>("verwaltung");

  const [lernstand, setLernstand] =
    useState<Lernstand>({});

  const [eigeneVokabeln, setEigeneVokabeln] =
    useState<Vokabel[]>([]);

  const [eigeneKategorien, setEigeneKategorien] =
    useState<Kategorie[]>([]);

  const [suchtext, setSuchtext] =
    useState("");

  const [aktiveKategorie, setAktiveKategorie] =
    useState("alle");

  /*
   * Vokabel bearbeiten / hinzufügen
   */
  const [modalSichtbar, setModalSichtbar] =
    useState(false);

  const [bearbeiteteVokabel, setBearbeiteteVokabel] =
    useState<Vokabel | null>(null);

  const [deutsch, setDeutsch] =
    useState("");

  const [spanisch, setSpanisch] =
    useState("");

  const [kategorie, setKategorie] =
    useState("");

  /*
   * Löschen
   */
  const [loeschModalSichtbar, setLoeschModalSichtbar] =
    useState(false);

  const [vokabelZumLoeschen, setVokabelZumLoeschen] =
    useState<Vokabel | null>(null);

  const [loeschenLaeuft, setLoeschenLaeuft] =
    useState(false);

  /*
   * Lernen
   */
  const [lernListe, setLernListe] =
    useState<Vokabel[]>([]);

  const [lernIndex, setLernIndex] =
    useState(0);

  const [lernModus, setLernModus] =
    useState<LernModus>("deutsch");

  const [antwortAngezeigt, setAntwortAngezeigt] =
    useState(false);

  const [falscheVokabeln, setFalscheVokabeln] =
    useState<Vokabel[]>([]);

  const [rundeBeendet, setRundeBeendet] =
    useState(false);

  const params = useLocalSearchParams<{
    kategorie?: string;
    lernen?: string;
  }>();

  const [datenGeladen, setDatenGeladen] =
    useState(false);

  const direktLernenGestartet = useRef(false);

  useEffect(() => {
    ladeDaten();
  }, []);

  async function ladeDaten() {
    try {
      const gespeicherterLernstand =
        await AsyncStorage.getItem(
          LERNSTAND_KEY
        );

      const gespeicherteVokabeln =
        await AsyncStorage.getItem(
          EIGENE_VOKABELN_KEY
        );

      const gespeicherteKategorien =
        await AsyncStorage.getItem(
          EIGENE_KATEGORIEN_KEY
        );

      if (gespeicherterLernstand) {
        try {
          const daten = JSON.parse(
            gespeicherterLernstand
          );

          if (
            daten &&
            typeof daten === "object"
          ) {
            setLernstand(normalisiereLernstand(daten));
          } else {
            setLernstand({});
          }
        } catch {
          setLernstand({});
        }
      }

      if (gespeicherteVokabeln) {
        try {
          const daten = JSON.parse(
            gespeicherteVokabeln
          );

          if (Array.isArray(daten)) {
            setEigeneVokabeln(daten);
          } else {
            setEigeneVokabeln([]);
          }
        } catch {
          setEigeneVokabeln([]);
        }
      }

      if (gespeicherteKategorien) {
        try {
          const daten = JSON.parse(
            gespeicherteKategorien
          );

          if (Array.isArray(daten)) {
            setEigeneKategorien(daten);
          } else {
            setEigeneKategorien([]);
          }
        } catch {
          setEigeneKategorien([]);
        }
      }
    } catch (error) {
      console.log(
        "Fehler beim Laden:",
        error
      );
    } finally {
      setDatenGeladen(true);
    }
  }

  /*
   * Alle Kategorien
   */
  const kategorien = useMemo(() => {
    return [
      ...standardKategorien,
      ...eigeneKategorien,
    ];
  }, [eigeneKategorien]);

  /*
   * Alle Vokabeln
   */
  const alleKarten = useMemo(() => {
    return [
      ...alleVokabeln,
      ...eigeneVokabeln,
    ];
  }, [eigeneVokabeln]);

  /*
   * Suche + Kategorie
   */
  const gefilterteVokabeln = useMemo(() => {
    const suche =
      suchtext.trim().toLowerCase();

    return alleKarten.filter((vokabel) => {
      const passtZurSuche =
        !suche ||
        String(vokabel.deutsch)
          .toLowerCase()
          .includes(suche) ||
        String(vokabel.spanisch)
          .toLowerCase()
          .includes(suche);

      const passtZurKategorie =
        aktiveKategorie === "alle" ||
        String(vokabel.kategorie) ===
          String(aktiveKategorie);

      return (
        passtZurSuche &&
        passtZurKategorie
      );
    });
  }, [
    alleKarten,
    suchtext,
    aktiveKategorie,
  ]);

  /*
   * Prüfen, ob eigene Vokabel
   */
  function istEigeneVokabel(
    vokabel: Vokabel
  ) {
    return eigeneVokabeln.some(
      (v) =>
        String(v.id) ===
        String(vokabel.id)
    );
  }

  /*
   * Kategorie Name
   */
  function holeKategorieName(
    id: string
  ) {
    const gefunden =
      kategorien.find(
        (kat) =>
          String(kat.id) ===
          String(id)
      );

    return (
      gefunden?.name ??
      "Unbekannt"
    );
  }

  /*
   * Kategorie Emoji
   */
  function holeKategorieEmoji(
    id: string
  ) {
    const gefunden =
      kategorien.find(
        (kat) =>
          String(kat.id) ===
          String(id)
      );

    return (
      gefunden?.emoji ??
      "📚"
    );
  }

  /*
   * Level
   *
   * Wenn noch kein Lernstand vorhanden ist,
   * wird automatisch Level 1 angezeigt.
   */
  function holeLevel(vokabel: Vokabel) {
    const stand = lernstand[String(vokabel.id)];
    return stand?.level ?? 1;
  }

  /*
   * Zurück zur vorherigen Seite
   */
  function geheZurueck() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  /*
   * Neue Vokabel
   */
  function oeffneNeueVokabel() {
    setBearbeiteteVokabel(null);
    setDeutsch("");
    setSpanisch("");

    if (
      eigeneKategorien.length > 0
    ) {
      setKategorie(
        eigeneKategorien[0].id
      );
    } else if (
      standardKategorien.length > 0
    ) {
      setKategorie(
        standardKategorien[0].id
      );
    } else {
      setKategorie("");
    }

    setModalSichtbar(true);
  }

  /*
   * Vokabel bearbeiten
   */
  function oeffneBearbeiten(
    vokabel: Vokabel
  ) {
    if (!istEigeneVokabel(vokabel)) {
      Alert.alert(
        "Nicht möglich",
        "Standard-Vokabeln können nicht bearbeitet werden."
      );

      return;
    }

    setBearbeiteteVokabel(vokabel);
    setDeutsch(vokabel.deutsch);
    setSpanisch(vokabel.spanisch);
    setKategorie(vokabel.kategorie);

    setModalSichtbar(true);
  }

  /*
   * Vokabel speichern
   */
  async function vokabelSpeichern() {
    const deutscherText =
      deutsch.trim();

    const spanischerText =
      spanisch.trim();

    if (
      !deutscherText ||
      !spanischerText ||
      !kategorie
    ) {
      Alert.alert(
        "Fehlende Angaben",
        "Bitte gib Deutsch, Spanisch und eine Kategorie an."
      );

      return;
    }

    try {
      let neueListe: Vokabel[];

      /*
       * Bearbeiten
       */
      if (bearbeiteteVokabel) {
        neueListe =
          eigeneVokabeln.map(
            (vokabel) => {
              if (
                String(vokabel.id) ===
                String(
                  bearbeiteteVokabel.id
                )
              ) {
                return {
                  ...vokabel,
                  deutsch:
                    deutscherText,
                  spanisch:
                    spanischerText,
                  kategorie,
                };
              }

              return vokabel;
            }
          );
      } else {
        /*
         * Neue Vokabel
         */
        const neueVokabel: Vokabel = {
          id: Date.now(),
          deutsch: deutscherText,
          spanisch: spanischerText,
          kategorie,
        };

        neueListe = [
          ...eigeneVokabeln,
          neueVokabel,
        ];
      }

      await AsyncStorage.setItem(
        EIGENE_VOKABELN_KEY,
        JSON.stringify(neueListe)
      );

      setEigeneVokabeln(
        neueListe
      );

      setModalSichtbar(false);

      setDeutsch("");
      setSpanisch("");
      setKategorie("");
      setBearbeiteteVokabel(
        null
      );
    } catch (error) {
      console.log(
        "Fehler beim Speichern:",
        error
      );

      Alert.alert(
        "Fehler",
        "Die Vokabel konnte nicht gespeichert werden."
      );
    }
  }

  /*
   * Lösch-Abfrage öffnen
   */
  function loescheVokabel(
    vokabel: Vokabel
  ) {
    if (!istEigeneVokabel(vokabel)) {
      Alert.alert(
        "Nicht möglich",
        "Standard-Vokabeln können nicht gelöscht werden."
      );

      return;
    }

    console.log(
      "Lösch-Button gedrückt:",
      vokabel.id,
      vokabel.deutsch
    );

    setVokabelZumLoeschen(
      vokabel
    );

    setLoeschModalSichtbar(
      true
    );
  }

  /*
   * Löschen abbrechen
   */
  function brecheLoeschenAb() {
    setLoeschModalSichtbar(
      false
    );

    setVokabelZumLoeschen(
      null
    );
  }

  /*
   * Löschen endgültig durchführen
   */
  async function bestaetigeLoeschen() {
    if (!vokabelZumLoeschen) {
      return;
    }

    const vokabel =
      vokabelZumLoeschen;

    setLoeschenLaeuft(true);

    try {
      console.log(
        "Löschen gestartet:",
        vokabel.id,
        vokabel.deutsch
      );

      const gespeicherteDaten =
        await AsyncStorage.getItem(
          EIGENE_VOKABELN_KEY
        );

      let aktuelleVokabeln: Vokabel[] =
        [];

      if (gespeicherteDaten) {
        try {
          const daten =
            JSON.parse(
              gespeicherteDaten
            );

          if (Array.isArray(daten)) {
            aktuelleVokabeln =
              daten;
          }
        } catch (error) {
          console.log(
            "Gespeicherte Vokabeln konnten nicht gelesen werden:",
            error
          );
        }
      }

      console.log(
        "Vokabeln vor dem Löschen:",
        aktuelleVokabeln
      );

      const neueVokabeln =
        aktuelleVokabeln.filter(
          (v) =>
            String(v.id) !==
            String(vokabel.id)
        );

      if (
        neueVokabeln.length ===
        aktuelleVokabeln.length
      ) {
        setLoeschenLaeuft(false);

        Alert.alert(
          "Nicht gelöscht",
          "Die Vokabel wurde in den gespeicherten Daten nicht gefunden."
        );

        return;
      }

      /*
       * Vokabel speichern
       */
      await AsyncStorage.setItem(
        EIGENE_VOKABELN_KEY,
        JSON.stringify(
          neueVokabeln
        )
      );

      /*
       * Lernstand laden
       */
      const gespeicherterLernstand =
        await AsyncStorage.getItem(
          LERNSTAND_KEY
        );

      let neuerLernstand: Lernstand =
        {};

      if (
        gespeicherterLernstand
      ) {
        try {
          const daten =
            JSON.parse(
              gespeicherterLernstand
            );

          if (
            daten &&
            typeof daten ===
              "object"
          ) {
            neuerLernstand =
              daten;
          }
        } catch {
          neuerLernstand = {};
        }
      }

      /*
       * Lernstand der Vokabel entfernen
       */
      delete neuerLernstand[
        String(vokabel.id)
      ];

      await AsyncStorage.setItem(
        LERNSTAND_KEY,
        JSON.stringify(
          neuerLernstand
        )
      );

      /*
       * State aktualisieren
       */
      setEigeneVokabeln(
        neueVokabeln
      );

      setLernstand(
        neuerLernstand
      );

      setLoeschModalSichtbar(
        false
      );

      setVokabelZumLoeschen(
        null
      );

      console.log(
        "Vokabel erfolgreich gelöscht:",
        vokabel.id
      );
    } catch (error) {
      console.log(
        "Fehler beim Löschen:",
        error
      );

      Alert.alert(
        "Fehler",
        "Die Vokabel konnte nicht gelöscht werden."
      );
    } finally {
      setLoeschenLaeuft(false);
    }
  }

  /*
   * Lernstand aktualisieren
   */
  async function aktualisiereLernstand(
    vokabel: Vokabel,
    richtig: boolean
  ) {
    const id = String(vokabel.id);
    const neuEintrag = neuerLernstand(
      lernstand[id],
      richtig,
      lernModus
    );

    const neu: Lernstand = {
      ...lernstand,
      [id]: neuEintrag,
    };

    setLernstand(neu);

    try {
      await AsyncStorage.setItem(
        LERNSTAND_KEY,
        JSON.stringify(neu)
      );
    } catch (error) {
      console.log(
        "Fehler beim Speichern des Lernstands:",
        error
      );
    }
  }

  /*
   * Lernen starten
   */
  function starteLernen() {
    if (gefilterteVokabeln.length === 0) {
      Alert.alert(
        "Keine Vokabeln",
        "Für deine aktuelle Auswahl gibt es keine Vokabeln."
      );
      return;
    }

    const jetzt = Date.now();
    const ausgewaehlt = waehleLernkarten(
      gefilterteVokabeln,
      lernstand,
      Math.min(20, Math.max(10, gefilterteVokabeln.length)),
      jetzt
    );

    if (ausgewaehlt.length === 0) {
      Alert.alert(
        "Nichts zu lernen",
        "Für deine Auswahl ist momentan keine Vokabel fällig."
      );
      return;
    }

    setLernListe(ausgewaehlt);
    setLernIndex(0);
    setLernModus("deutsch");
    setAntwortAngezeigt(false);
    setFalscheVokabeln([]);
    setRundeBeendet(false);
    setAnsicht("lernen");
  }

  useEffect(() => {
    if (!datenGeladen || direktLernenGestartet.current) return;
    if (params.lernen !== "true" || !params.kategorie) return;

    direktLernenGestartet.current = true;

    const karten =
      params.kategorie === "alle"
        ? alleKarten
        : alleKarten.filter(
            (vokabel) =>
              String(vokabel.kategorie) ===
              String(params.kategorie)
          );

    if (karten.length === 0) {
      Alert.alert(
        "Keine Vokabeln",
        "In dieser Kategorie gibt es noch keine Vokabeln."
      );
      router.replace("/");
      return;
    }

    const ausgewaehlt = waehleLernkarten(
      karten,
      lernstand,
      Math.min(20, Math.max(10, karten.length))
    );

    setLernListe(ausgewaehlt);
    setLernIndex(0);
    setLernModus("deutsch");
    setAntwortAngezeigt(false);
    setFalscheVokabeln([]);
    setRundeBeendet(false);
    setAnsicht("lernen");
  }, [datenGeladen, params.lernen, params.kategorie, alleKarten, lernstand]);

  /*
   * Nächste Lernkarte
   */
  function naechsteVokabel(
    richtig: boolean
  ) {
    const aktuelleVokabel =
      lernListe[lernIndex];

    if (!aktuelleVokabel) {
      return;
    }

    aktualisiereLernstand(
      aktuelleVokabel,
      richtig
    );

    if (!richtig) {
      setFalscheVokabeln(
        (bisher) => {
          if (
            bisher.some(
              (v) =>
                v.id ===
                aktuelleVokabel.id
            )
          ) {
            return bisher;
          }

          return [
            ...bisher,
            aktuelleVokabel,
          ];
        }
      );
    }

    if (
      lernIndex >=
      lernListe.length - 1
    ) {
      setRundeBeendet(true);
      return;
    }

    setLernIndex(
      (index) => index + 1
    );

    setAntwortAngezeigt(
      false
    );
  }

  /*
   * Falsche Vokabeln wiederholen
   */
  function wiederholeFalsche() {
    if (
      falscheVokabeln.length ===
      0
    ) {
      return;
    }

    const gemischt =
      [...falscheVokabeln].sort(
        () =>
          Math.random() -
          0.5
      );

    setLernListe(gemischt);
    setLernIndex(0);
    setAntwortAngezeigt(false);
    setFalscheVokabeln([]);
    setRundeBeendet(false);
  }

  /*
   * Zur Verwaltung
   */
  function zurueckZurVerwaltung() {
    setAnsicht("verwaltung");
    setRundeBeendet(false);
  }

  const aktuelleVokabel =
    lernListe[lernIndex];

  /*
   * =========================
   * LERNMODUS
   * =========================
   */
  if (ansicht === "lernen") {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={
            styles.lernContainer
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={styles.lernHeader}
          >
            <Pressable
              style={styles.zurueckButton}
              onPress={
                zurueckZurVerwaltung
              }
            >
              <Text
                style={
                  styles.zurueckText
                }
              >
                ←
              </Text>
            </Pressable>

            <Text
              style={styles.lernTitel}
            >
              Lernen
            </Text>
          </View>

          {rundeBeendet ? (
            <View
              style={styles.endeCard}
            >
              <Text
                style={styles.endeEmoji}
              >
                🎉
              </Text>

              <Text
                style={styles.endeTitel}
              >
                Runde beendet!
              </Text>

              <Text
                style={styles.endeText}
              >
                Du hast{" "}
                {lernListe.length}{" "}
                Vokabeln gelernt.
              </Text>

              {falscheVokabeln.length >
                0 && (
                <Text
                  style={
                    styles.falschText
                  }
                >
                  {
                    falscheVokabeln.length
                  }{" "}
                  Vokabeln waren noch
                  nicht richtig.
                </Text>
              )}

              <Pressable
                style={
                  styles.primaryButton
                }
                onPress={
                  zurueckZurVerwaltung
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Zur Vokabelverwaltung
                </Text>
              </Pressable>

              {falscheVokabeln.length >
                0 && (
                <Pressable
                  style={
                    styles.secondaryButton
                  }
                  onPress={
                    wiederholeFalsche
                  }
                >
                  <Text
                    style={
                      styles.secondaryButtonText
                    }
                  >
                    🔄 Falsche wiederholen
                  </Text>
                </Pressable>
              )}
            </View>
          ) : aktuelleVokabel ? (
            <>
              <View
                style={
                  styles.progressContainer
                }
              >
                <Text
                  style={
                    styles.progressText
                  }
                >
                  {lernIndex + 1} /{" "}
                  {lernListe.length}
                </Text>

                <View
                  style={
                    styles.progressBarBackground
                  }
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${
                          ((lernIndex +
                            1) /
                            lernListe.length) *
                          100
                        }%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View
                style={
                  styles.richtungContainer
                }
              >
                <Pressable
                  style={[
                    styles.richtungButton,
                    lernModus ===
                      "deutsch" &&
                      styles.richtungButtonAktiv,
                  ]}
                  onPress={() =>
                    setLernModus(
                      "deutsch"
                    )
                  }
                >
                  <Text
                    style={[
                      styles.richtungText,
                      lernModus ===
                        "deutsch" &&
                        styles.richtungTextAktiv,
                    ]}
                  >
                    🇩🇪 Deutsch → Spanisch
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.richtungButton,
                    lernModus ===
                      "spanisch" &&
                      styles.richtungButtonAktiv,
                  ]}
                  onPress={() =>
                    setLernModus(
                      "spanisch"
                    )
                  }
                >
                  <Text
                    style={[
                      styles.richtungText,
                      lernModus ===
                        "spanisch" &&
                        styles.richtungTextAktiv,
                    ]}
                  >
                    🇪🇸 Spanisch → Deutsch
                  </Text>
                </Pressable>
              </View>

              <View
                style={styles.lernCard}
              >
                <Text
                  style={
                    styles.lernKategorie
                  }
                >
                  {holeKategorieEmoji(
                    aktuelleVokabel.kategorie
                  )}{" "}
                  {holeKategorieName(
                    aktuelleVokabel.kategorie
                  )}
                </Text>

                <Text
                  style={styles.frageText}
                >
                  {lernModus ===
                  "deutsch"
                    ? aktuelleVokabel.deutsch
                    : aktuelleVokabel.spanisch}
                </Text>

                {antwortAngezeigt && (
                  <View
                    style={
                      styles.antwortBox
                    }
                  >
                    <Text
                      style={
                        styles.antwortLabel
                      }
                    >
                      Antwort
                    </Text>

                    <Text
                      style={
                        styles.antwortText
                      }
                    >
                      {lernModus ===
                      "deutsch"
                        ? aktuelleVokabel.spanisch
                        : aktuelleVokabel.deutsch}
                    </Text>
                  </View>
                )}

                {!antwortAngezeigt ? (
                  <Pressable
                    style={
                      styles.primaryButton
                    }
                    onPress={() =>
                      setAntwortAngezeigt(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      Antwort anzeigen
                    </Text>
                  </Pressable>
                ) : (
                  <View
                    style={
                      styles.antwortButtons
                    }
                  >
                    <Pressable
                      style={
                        styles.falschButton
                      }
                      onPress={() =>
                        naechsteVokabel(
                          false
                        )
                      }
                    >
                      <Text
                        style={
                          styles.falschButtonText
                        }
                      >
                        ❌ Falsch
                      </Text>
                    </Pressable>

                    <Pressable
                      style={
                        styles.richtigButton
                      }
                      onPress={() =>
                        naechsteVokabel(
                          true
                        )
                      }
                    >
                      <Text
                        style={
                          styles.richtigButtonText
                        }
                      >
                        ✅ Richtig
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  /*
   * =========================
   * VERWALTUNG
   * =========================
   */
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View
            style={
              styles.headerLinks
            }
          >
            <Pressable
              style={
                styles.headerBackButton
              }
              onPress={geheZurueck}
            >
              <Text
                style={
                  styles.headerBackText
                }
              >
                ←
              </Text>
            </Pressable>

            <View>
              <Text
                style={styles.titel}
              >
                Vokabeln
              </Text>

              <Text
                style={
                  styles.untertitel
                }
              >
                Verwalte und lerne deine
                Vokabeln
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={
              oeffneNeueVokabel
            }
          >
            <Text
              style={
                styles.addButtonText
              }
            >
              ＋
            </Text>
          </Pressable>
        </View>

        {/* NUR LERNEN */}
        <View
          style={
            styles.aktionsZeile
          }
        >
          <Pressable
            style={styles.lernenButton}
            onPress={starteLernen}
          >
            <Text
              style={
                styles.lernenButtonText
              }
            >
              ▶ Lernen
            </Text>
          </Pressable>
        </View>

        {/* SUCHE */}
        <View
          style={styles.sucheBox}
        >
          <Text
            style={styles.sucheIcon}
          >
            🔎
          </Text>

          <TextInput
            style={
              styles.sucheInput
            }
            placeholder="Deutsch oder Spanisch suchen..."
            placeholderTextColor="#999"
            value={suchtext}
            onChangeText={
              setSuchtext
            }
          />

          {suchtext.length > 0 && (
            <Pressable
              onPress={() =>
                setSuchtext("")
              }
            >
              <Text
                style={
                  styles.sucheLoeschen
                }
              >
                ✕
              </Text>
            </Pressable>
          )}
        </View>

        {/* KATEGORIE FILTER */}
        <Text
          style={
            styles.filterTitel
          }
        >
          Kategorie
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.filterContainer
          }
        >
          <Pressable
            style={[
              styles.filterButton,
              aktiveKategorie ===
                "alle" &&
                styles.filterButtonAktiv,
            ]}
            onPress={() =>
              setAktiveKategorie(
                "alle"
              )
            }
          >
            <Text
              style={[
                styles.filterText,
                aktiveKategorie ===
                  "alle" &&
                  styles.filterTextAktiv,
              ]}
            >
              📚 Alle
            </Text>
          </Pressable>

          {kategorien.map(
            (kat) => (
              <Pressable
                key={kat.id}
                style={[
                  styles.filterButton,
                  aktiveKategorie ===
                    kat.id &&
                    styles.filterButtonAktiv,
                ]}
                onPress={() =>
                  setAktiveKategorie(
                    kat.id
                  )
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    aktiveKategorie ===
                      kat.id &&
                      styles.filterTextAktiv,
                  ]}
                >
                  {kat.emoji ??
                    "📚"}{" "}
                  {kat.name}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>

        {/* ANZAHL */}
        <View
          style={
            styles.listenHeader
          }
        >
          <Text
            style={
              styles.anzahlText
            }
          >
            {gefilterteVokabeln.length}{" "}
            {gefilterteVokabeln.length ===
            1
              ? "Vokabel"
              : "Vokabeln"}
          </Text>
        </View>

        {/* LISTE */}
        {gefilterteVokabeln.length ===
        0 ? (
          <View
            style={
              styles.leerCard
            }
          >
            <Text
              style={
                styles.leerEmoji
              }
            >
              📭
            </Text>

            <Text
              style={
                styles.leerTitel
              }
            >
              Keine Vokabeln gefunden
            </Text>

            <Text
              style={
                styles.leerText
              }
            >
              Versuche einen anderen
              Suchbegriff oder eine andere
              Kategorie.
            </Text>
          </View>
        ) : (
          <View
            style={styles.liste}
          >
            {gefilterteVokabeln.map(
              (vokabel) => {
                const eigene =
                  istEigeneVokabel(
                    vokabel
                  );

                /*
                 * Wichtig:
                 * Level immer anzeigen.
                 * Ohne gespeicherten Lernstand = Level 1.
                 */
                const level =
                  holeLevel(
                    vokabel
                  );

                return (
                  <View
                    key={String(
                      vokabel.id
                    )}
                    style={[
                      styles.vokabelCard,
                      eigene &&
                        styles.eigeneVokabelCard,
                    ]}
                  >
                    {/* OBEN */}
                    <View
                      style={
                        styles.vokabelOben
                      }
                    >
                      <View
                        style={
                          styles.vokabelTexte
                        }
                      >
                        <Text
                          style={
                            styles.deutschText
                          }
                        >
                          {
                            vokabel.deutsch
                          }
                        </Text>

                        <Text
                          style={
                            styles.spanischText
                          }
                        >
                          {
                            vokabel.spanisch
                          }
                        </Text>
                      </View>

                      {!eigene && (
                        <View
                          style={
                            styles.standardBadge
                          }
                        >
                          <Text
                            style={
                              styles.standardBadgeText
                            }
                          >
                            Standard
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* KATEGORIE + LEVEL */}
                    <View
                      style={
                        styles.kategorieZeile
                      }
                    >
                      <Text
                        style={
                          styles.kategorieText
                        }
                      >
                        {holeKategorieEmoji(
                          vokabel.kategorie
                        )}{" "}
                        {holeKategorieName(
                          vokabel.kategorie
                        )}
                      </Text>

                      <View
                        style={
                          styles.levelBadge
                        }
                      >
                        <Text
                          style={
                            styles.levelText
                          }
                        >
                          ⭐ Level {level}
                        </Text>
                      </View>
                    </View>

                    {/* ICON BUTTONS */}
                    {eigene && (
                      <View
                        style={
                          styles.vocabActions
                        }
                      >
                        <Pressable
                          style={({
                            pressed,
                          }) => [
                            styles.iconButton,
                            styles.editButton,
                            pressed &&
                              styles.buttonGedrueckt,
                          ]}
                          onPress={() =>
                            oeffneBearbeiten(
                              vokabel
                            )
                          }
                        >
                          <Text
                            style={
                              styles.iconButtonText
                            }
                          >
                            ✏️
                          </Text>
                        </Pressable>

                        <Pressable
                          style={({
                            pressed,
                          }) => [
                            styles.iconButton,
                            styles.deleteButton,
                            pressed &&
                              styles.buttonGedrueckt,
                          ]}
                          onPress={() =>
                            loescheVokabel(
                              vokabel
                            )
                          }
                        >
                          <Text
                            style={
                              styles.iconButtonText
                            }
                          >
                            🗑️
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* INFO */}
        <View
          style={styles.infoBox}
        >
          <Text
            style={styles.infoTitel}
          >
            💡 Hinweis
          </Text>

          <Text
            style={styles.infoText}
          >
            Standard-Vokabeln können nicht
            verändert oder gelöscht werden.
            Deine eigenen Vokabeln kannst du
            jederzeit bearbeiten oder löschen.
          </Text>
        </View>
      </ScrollView>

      {/* =========================
          VOKABEL-MODAL
          ========================= */}
      <Modal
        visible={modalSichtbar}
        animationType="slide"
        transparent
        onRequestClose={() =>
          setModalSichtbar(
            false
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={styles.modalCard}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitel
                }
              >
                {bearbeiteteVokabel
                  ? "Vokabel bearbeiten"
                  : "Neue Vokabel"}
              </Text>

              <Pressable
                onPress={() =>
                  setModalSichtbar(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.modalSchliessen
                  }
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              Deutsch
            </Text>

            <TextInput
              style={styles.input}
              placeholder="z. B. Guten Abend"
              placeholderTextColor="#999"
              value={deutsch}
              onChangeText={
                setDeutsch
              }
              autoCapitalize="sentences"
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Spanisch
            </Text>

            <TextInput
              style={styles.input}
              placeholder="z. B. Buenas noches"
              placeholderTextColor="#999"
              value={spanisch}
              onChangeText={
                setSpanisch
              }
              autoCapitalize="sentences"
            />

            <Text
              style={
                styles.inputLabel
              }
            >
              Kategorie
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.modalKategorien
              }
            >
              {kategorien.map(
                (kat) => (
                  <Pressable
                    key={kat.id}
                    style={[
                      styles.modalKategorieButton,
                      kategorie ===
                        kat.id &&
                        styles.modalKategorieAktiv,
                    ]}
                    onPress={() =>
                      setKategorie(
                        kat.id
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.modalKategorieText,
                        kategorie ===
                          kat.id &&
                          styles.modalKategorieTextAktiv,
                      ]}
                    >
                      {kat.emoji ??
                        "📚"}{" "}
                      {kat.name}
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>

            <Pressable
              style={
                styles.speichernButton
              }
              onPress={
                vokabelSpeichern
              }
            >
              <Text
                style={
                  styles.speichernButtonText
                }
              >
                {bearbeiteteVokabel
                  ? "Änderungen speichern"
                  : "Vokabel hinzufügen"}
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.abbrechenButton
              }
              onPress={() =>
                setModalSichtbar(
                  false
                )
              }
            >
              <Text
                style={
                  styles.abbrechenButtonText
                }
              >
                Abbrechen
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* =========================
          LÖSCHEN-BESTÄTIGUNG
          ========================= */}
      <Modal
        visible={
          loeschModalSichtbar
        }
        animationType="fade"
        transparent
        onRequestClose={
          brecheLoeschenAb
        }
      >
        <View
          style={
            styles.loeschOverlay
          }
        >
          <View
            style={
              styles.loeschCard
            }
          >
            <View
              style={
                styles.loeschIcon
              }
            >
              <Text
                style={
                  styles.loeschIconText
                }
              >
                🗑️
              </Text>
            </View>

            <Text
              style={
                styles.loeschTitel
              }
            >
              Vokabel löschen?
            </Text>

            {vokabelZumLoeschen && (
              <>
                <Text
                  style={
                    styles.loeschVokabel
                  }
                >
                  {
                    vokabelZumLoeschen.deutsch
                  }
                </Text>

                <Text
                  style={
                    styles.loeschSpanisch
                  }
                >
                  {
                    vokabelZumLoeschen.spanisch
                  }
                </Text>
              </>
            )}

            <Text
              style={
                styles.loeschHinweis
              }
            >
              Diese Vokabel wird dauerhaft aus
              deinen eigenen Vokabeln entfernt.
            </Text>

            <View
              style={
                styles.loeschButtons
              }
            >
              <Pressable
                style={
                  styles.loeschAbbrechen
                }
                onPress={
                  brecheLoeschenAb
                }
                disabled={
                  loeschenLaeuft
                }
              >
                <Text
                  style={
                    styles.loeschAbbrechenText
                  }
                >
                  Abbrechen
                </Text>
              </Pressable>

              <Pressable
                style={
                  styles.loeschBestaetigen
                }
                onPress={
                  bestaetigeLoeschen
                }
                disabled={
                  loeschenLaeuft
                }
              >
                <Text
                  style={
                    styles.loeschBestaetigenText
                  }
                >
                  {loeschenLaeuft
                    ? "Löschen..."
                    : "Ja, löschen"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  /*
   * HEADER
   */
  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerLinks: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef0f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerBackText: {
    fontSize: 27,
    color: "#111827",
    marginTop: -2,
  },

  titel: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1f2937",
  },

  untertitel: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },

  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "500",
    marginTop: -2,
  },

  /*
   * AKTIONEN
   */
  aktionsZeile: {
    marginBottom: 16,
  },

  lernenButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  lernenButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  /*
   * SUCHE
   */
  sucheBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  sucheIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  sucheInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },

  sucheLoeschen: {
    fontSize: 18,
    color: "#9ca3af",
    padding: 4,
  },

  /*
   * FILTER
   */
  filterTitel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 10,
  },

  filterContainer: {
    gap: 8,
    paddingBottom: 6,
  },

  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  filterButtonAktiv: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  filterText: {
    color: "#4b5563",
    fontSize: 13,
    fontWeight: "700",
  },

  filterTextAktiv: {
    color: "#fff",
  },

  /*
   * LISTE
   */
  listenHeader: {
    marginTop: 20,
    marginBottom: 10,
  },

  anzahlText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "700",
  },

  liste: {
    gap: 12,
  },

  vokabelCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  eigeneVokabelCard: {
    borderColor: "#dbeafe",
  },

  vokabelOben: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
  },

  vokabelTexte: {
    flex: 1,
    paddingRight: 10,
  },

  deutschText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111827",
  },

  spanischText: {
    fontSize: 17,
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 5,
  },

  standardBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  standardBadgeText: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "800",
  },

  /*
   * KATEGORIE + LEVEL
   */
  kategorieZeile: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginTop: 14,
  },

  kategorieText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  levelBadge: {
    backgroundColor: "#f5f3ff",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginLeft: 8,
  },

  levelText: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "800",
  },

  /*
   * ICON BUTTONS
   */
  vocabActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f2f5",
  },

  iconButton: {
    width: 44,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  editButton: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  deleteButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  iconButtonText: {
    fontSize: 20,
  },

  buttonGedrueckt: {
    opacity: 0.55,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  /*
   * LEER
   */
  leerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 4,
  },

  leerEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },

  leerTitel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#374151",
  },

  leerText: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 7,
    lineHeight: 20,
  },

  /*
   * INFO
   */
  infoBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  infoTitel: {
    color: "#1d4ed8",
    fontWeight: "800",
    marginBottom: 5,
  },

  infoText: {
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 19,
  },

  /*
   * VOKABEL-MODAL
   */
  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 30,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitel: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111827",
  },

  modalSchliessen: {
    fontSize: 22,
    color: "#6b7280",
    padding: 5,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 7,
    marginTop: 6,
  },

  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    fontSize: 16,
    color: "#111827",
    marginBottom: 10,
  },

  modalKategorien: {
    gap: 8,
    paddingVertical: 5,
    paddingBottom: 14,
  },

  modalKategorieButton: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  modalKategorieAktiv: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  modalKategorieText: {
    color: "#4b5563",
    fontWeight: "700",
    fontSize: 13,
  },

  modalKategorieTextAktiv: {
    color: "#fff",
  },

  speichernButton: {
    backgroundColor: "#2563eb",
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  speichernButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  abbrechenButton: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  abbrechenButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "700",
  },

  /*
   * LÖSCH-MODAL
   */
  loeschOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  loeschCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
  },

  loeschIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  loeschIconText: {
    fontSize: 28,
  },

  loeschTitel: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  loeschVokabel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 14,
    textAlign: "center",
  },

  loeschSpanisch: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
    marginTop: 4,
    textAlign: "center",
  },

  loeschHinweis: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 20,
  },

  loeschButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },

  loeschAbbrechen: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },

  loeschAbbrechenText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
  },

  loeschBestaetigen: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },

  loeschBestaetigenText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  /*
   * LERNEN
   */
  lernContainer: {
    padding: 20,
    paddingBottom: 50,
    flexGrow: 1,
  },

  lernHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  zurueckButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#eef0f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  zurueckText: {
    color: "#111827",
    fontSize: 26,
  },

  lernTitel: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },

  progressContainer: {
    marginBottom: 20,
  },

  progressText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },

  progressBarBackground: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 8,
  },

  richtungContainer: {
    gap: 8,
    marginBottom: 18,
  },

  richtungButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  richtungButtonAktiv: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
  },

  richtungText: {
    color: "#6b7280",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 13,
  },

  richtungTextAktiv: {
    color: "#1d4ed8",
  },

  lernCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },

  lernKategorie: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 30,
  },

  frageText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 30,
  },

  antwortBox: {
    width: "100%",
    backgroundColor: "#f0fdf4",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginBottom: 20,
  },

  antwortLabel: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },

  antwortText: {
    color: "#166534",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  primaryButton: {
    width: "100%",
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  antwortButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },

  falschButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
  },

  falschButtonText: {
    color: "#dc2626",
    fontWeight: "800",
    fontSize: 14,
  },

  richtigButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
    justifyContent: "center",
  },

  richtigButtonText: {
    color: "#16a34a",
    fontWeight: "800",
    fontSize: 14,
  },

  endeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 20,
  },

  endeEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },

  endeTitel: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },

  endeText: {
    color: "#6b7280",
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },

  falschText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },

  secondaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#374151",
    fontWeight: "800",
    fontSize: 14,
  },
});