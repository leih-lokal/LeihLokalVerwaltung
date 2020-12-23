<script>
    import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
    import InputTypes from "../../Input/InputTypes";
    import PopupFormular from "../../Input/PopupFormular.svelte";
    import { itemDb, rentalDb, customerDb } from "../../../utils/stores";
    import { notifier } from "@beyonk/svelte-notifications";
    import WoocommerceClient from "ENV_WC_CLIENT";

    const woocommerceClient = new WoocommerceClient();

    export let createNew;
    export let doc = {};

    const popupFormularConfiguration = new PopupFormularConfiguration()
        .setDocName("Leihvorgang")
        .setCreateInitialDoc((doc) => {
            doc.rented_on = new Date().getTime();
            let inOneWeek = new Date();
            inOneWeek.setDate(inOneWeek.getDate() + 7);
            doc.to_return_on = inOneWeek.getTime();
        })
        .setOnDeleteButtonClicked((doc, close) => {
            if (confirm("Soll dieser Leihvorgang wirklich gelöscht werden?")) {
                $rentalDb
                    .removeDoc(doc)
                    .then(() => notifier.success("Leihvorgang gelöscht!"))
                    .then(close)
                    .catch((error) => {
                        console.error(error);
                        notifier.danger(
                            "Leihvorgang konnte nicht gelöscht werden!",
                            6000
                        );
                    });
            }
        })
        .setOnSaveButtonClicked(async (doc, createNew, close) => {
            if (doc.item_id) {
                const item = await $itemDb.fetchById(doc.item_id);
                doc.image = item.image;

                if (updateStatusOnWebsite) {
                    if (
                        doc.returned_on &&
                        doc.returned_on !== 0 &&
                        doc.returned_on <= new Date().getTime()
                    ) {
                        item.status_on_website = "instock";
                        $itemDb.updateDoc(item);
                        woocommerceClient
                            .updateItem(item)
                            .then(() => {
                                notifier.success(
                                    `'${item.item_name}' wurde auf der Webseite als verfügbar markiert.`
                                );
                            })
                            .catch((error) => {
                                notifier.warning(
                                    `Status von '${item.item_name}' konnte auf der der Webseite nicht aktualisiert werden!`,
                                    6000
                                );
                                console.error(error);
                            });
                    } else if (createNew) {
                        item.status_on_website = "outofstock";
                        $itemDb.updateDoc(item);
                        woocommerceClient
                            .updateItem(item)
                            .then(() => {
                                notifier.success(
                                    `'${item.item_name}' wurde auf der Webseite als verliehen markiert.`
                                );
                            })
                            .catch((error) => {
                                notifier.warning(
                                    `Status von '${item.item_name}' konnte auf der der Webseite nicht aktualisiert werden!`,
                                    6000
                                );
                                console.error(error);
                            });
                    }
                }
            }

            (createNew
                ? $rentalDb.createDocWithoutId(doc)
                : $rentalDb.updateDoc(doc)
            )
                .then((result) => notifier.success("Leihvorgang gespeichert!"))
                .then(close)
                .catch((error) => {
                    notifier.danger(
                        "Leihvorgang konnte nicht gespeichert werden!",
                        6000
                    );
                    console.error(error);
                });
        })
        .setInputGroups([
            "Gegenstand",
            "Zeitraum",
            "Kunde",
            "Pfand",
            "Mitarbeiter",
        ])
        .setInputs([
            {
                id: "item_id",
                label: "Nr",
                group: "Gegenstand",
                type: InputTypes.TEXT,
                bindToDocAttribute: "item_id",
            },
            {
                id: "item_name",
                label: "Name",
                group: "Gegenstand",
                type: InputTypes.TEXT,
                bindToDocAttribute: "item_name",
            },
            {
                id: "update_status_on_website",
                label: "Status auf Webseite aktualisieren",
                group: "Gegenstand",
                type: InputTypes.CHECKBOX,
            },
        ]);
</script>

<PopupFormular {popupFormularConfiguration} {createNew} {doc} />
