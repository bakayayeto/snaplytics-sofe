// src/screens/BookingSummaryModal.js
import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    Pressable,
} from "react-native";
import Icon from "../components/Icon";
import { Button } from "../components/ui";
import { colors, spacing, radii, shadow } from "../constants/theme";
import { useScale } from "../hooks/useScale";
import { parseStringArrayField } from "../utils/packageFieldParse";
import { formatMonthDayYear } from "../utils/dateDisplay";

export default function BookingSummaryModal({
    visible,
    onClose,
    onEdit,
    onConfirm,
    category,
    selectedPackage,
    selectedAddons,
    customerInfo,
    loading,
}) {
    const { s, fs, isTablet, W } = useScale();

    if (!selectedPackage || !customerInfo) return null;

    const pkgPrice = Number(
        selectedPackage?.promo_price
            ? selectedPackage.promo_price
            : selectedPackage?.price
              ? selectedPackage.price
              : 0,
    );
    const addonsTotal = selectedAddons.reduce(
        (sum, a) => sum + Number(a.price),
        0,
    );
    const subtotalVal = pkgPrice + addonsTotal;
    const grandTotal = subtotalVal;
    const inclusions = parseStringArrayField(selectedPackage.inclusions) ?? [];

    // ── TABLET: centered fixed dialog, no scroll, raw dp sizing ─────────────────
    if (isTablet) {
        const dialogW = Math.min(720, W * 0.86);

        return (
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >
                <Pressable
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    onPress={onClose}
                >
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <View
                            style={{
                                width: dialogW,
                                backgroundColor: "#fff",
                                borderRadius: 16,
                                overflow: "hidden",
                                ...shadow.lg,
                            }}
                        >
                            {/* ── Dialog header ── */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    paddingHorizontal: 20,
                                    paddingVertical: 14,
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.border,
                                }}
                            >
                                <Text
                                    style={{ fontSize: 15, fontWeight: "700" }}
                                    allowFontScaling={false}
                                >
                                    Booking Summary
                                </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={{ padding: 6 }}
                                >
                                    <Icon
                                        name="close"
                                        size={18}
                                        color={colors.mutedForeground}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* ── Two-column body ── */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    padding: 20,
                                    gap: 20,
                                }}
                            >
                                {/* Left column: customer info */}
                                <View
                                    style={{
                                        flex: 1,
                                        borderRightWidth: 1,
                                        borderRightColor: colors.border,
                                        paddingRight: 20,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            fontWeight: "700",
                                            color: colors.mutedForeground,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.8,
                                            marginBottom: 10,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Customer
                                    </Text>
                                    <SRow
                                        label="Name"
                                        value={customerInfo.fullName}
                                    />
                                    <SRow
                                        label="Email"
                                        value={customerInfo.email}
                                    />
                                    <SRow
                                        label="Contact"
                                        value={customerInfo.contactNumber}
                                    />
                                    {customerInfo.preferredDate ? (
                                        <SRow
                                            label="Date"
                                            value={formatMonthDayYear(
                                                customerInfo.preferredDate,
                                            )}
                                        />
                                    ) : null}
                                </View>

                                {/* Right column: booking details */}
                                <View style={{ flex: 1.3 }}>
                                    <Text
                                        style={{
                                            fontSize: 10,
                                            fontWeight: "700",
                                            color: colors.mutedForeground,
                                            textTransform: "uppercase",
                                            letterSpacing: 0.8,
                                            marginBottom: 10,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        Booking
                                    </Text>

                                    <SRow
                                        label="Category"
                                        value={category?.name}
                                    />
                                    <View
                                        style={{
                                            height: 1,
                                            backgroundColor: colors.border,
                                            marginVertical: 8,
                                        }}
                                    />

                                    {/* Package */}
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: 4,
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    color: colors.mutedForeground,
                                                    marginBottom: 2,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                Package
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: "600",
                                                }}
                                                allowFontScaling={false}
                                            >
                                                {selectedPackage.name}
                                            </Text>
                                            {inclusions
                                                .slice(0, 3)
                                                .map((item, i) => (
                                                    <Text
                                                        key={i}
                                                        style={{
                                                            fontSize: 11,
                                                            color: colors.mutedForeground,
                                                            marginLeft: 4,
                                                        }}
                                                        allowFontScaling={false}
                                                    >
                                                        • {item}
                                                    </Text>
                                                ))}
                                            {inclusions.length > 3 ? (
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        color: colors.mutedForeground,
                                                        marginLeft: 4,
                                                    }}
                                                    allowFontScaling={false}
                                                >
                                                    +{inclusions.length - 3}{" "}
                                                    more
                                                </Text>
                                            ) : null}
                                        </View>
                                        <Text
                                            style={{
                                                fontSize: 14,
                                                fontWeight: "700",
                                                color: colors.accent,
                                                marginLeft: 8,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            ₱{pkgPrice.toLocaleString()}
                                        </Text>
                                    </View>

                                    {/* Add-ons */}
                                    {selectedAddons.length > 0 && (
                                        <>
                                            <View
                                                style={{
                                                    height: 1,
                                                    backgroundColor:
                                                        colors.border,
                                                    marginVertical: 8,
                                                }}
                                            />
                                            <Text
                                                style={{
                                                    fontSize: 10,
                                                    color: colors.mutedForeground,
                                                    marginBottom: 4,
                                                }}
                                                allowFontScaling={false}
                                            >
                                                Add-ons
                                            </Text>
                                            {selectedAddons.map((addon) => (
                                                <View
                                                    key={addon.id}
                                                    style={{
                                                        flexDirection: "row",
                                                        justifyContent:
                                                            "space-between",
                                                        marginBottom: 3,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: "500",
                                                            flex: 1,
                                                        }}
                                                        allowFontScaling={false}
                                                    >
                                                        {addon.name}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: "600",
                                                            color: colors.accent,
                                                        }}
                                                        allowFontScaling={false}
                                                    >
                                                        +₱
                                                        {Number(
                                                            addon.price,
                                                        ).toLocaleString()}
                                                    </Text>
                                                </View>
                                            ))}
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* ── Total + notice + actions ── */}
                            <View
                                style={{
                                    paddingHorizontal: 20,
                                    paddingBottom: 20,
                                    gap: 12,
                                }}
                            >
                                {/* Total bar */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        backgroundColor: colors.accentLight,
                                        borderWidth: 1.5,
                                        borderColor: colors.primary,
                                        borderRadius: 10,
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                    }}
                                >
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                            flex: 1,
                                        }}
                                    >
                                        <Icon
                                            name="time-outline"
                                            size={13}
                                            color={colors.accent}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                color: colors.mutedForeground,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Will be{" "}
                                            <Text style={{ fontWeight: "700" }}>
                                                Pending
                                            </Text>{" "}
                                            until confirmed by staff
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            alignItems: "flex-end",
                                            marginLeft: 16,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                color: colors.mutedForeground,
                                                textTransform: "uppercase",
                                                letterSpacing: 0.4,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            Total
                                        </Text>
                                        <Text
                                            style={{
                                                fontSize: 20,
                                                fontWeight: "700",
                                                color: colors.accent,
                                            }}
                                            allowFontScaling={false}
                                        >
                                            ₱{grandTotal.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Actions */}
                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    <Button
                                        label="Edit Selection"
                                        icon="create-outline"
                                        variant="secondary"
                                        size="sm"
                                        onPress={onEdit}
                                        style={{
                                            flex: 1,
                                            height: 40,
                                            minHeight: 0,
                                        }}
                                        disabled={loading}
                                    />
                                    <Button
                                        label="Confirm Booking"
                                        onPress={onConfirm}
                                        size="sm"
                                        loading={loading}
                                        style={{
                                            flex: 1,
                                            height: 40,
                                            minHeight: 0,
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        );
    }

    // ── PHONE: bottom sheet with scroll ──────────────────────────────────────────
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                onPress={onClose}
            />
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "#fff",
                    borderTopLeftRadius: s(radii.xxl),
                    borderTopRightRadius: s(radii.xxl),
                    maxHeight: "92%",
                    ...shadow.lg,
                }}
            >
                <View
                    style={{
                        width: s(40),
                        height: s(4),
                        borderRadius: s(2),
                        backgroundColor: colors.border,
                        alignSelf: "center",
                        marginTop: s(spacing.md),
                    }}
                />
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: s(spacing.xxl),
                        paddingVertical: s(spacing.lg),
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                    }}
                >
                    <Text
                        style={{ fontSize: fs(18), fontWeight: "700" }}
                        allowFontScaling={false}
                    >
                        Booking Summary
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={{ padding: s(spacing.sm) }}
                    >
                        <Icon
                            name="close"
                            size={s(22)}
                            color={colors.mutedForeground}
                        />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    contentContainerStyle={{
                        padding: s(spacing.xxl),
                        paddingBottom: s(spacing.xxxl),
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text
                        style={{
                            fontSize: fs(11),
                            fontWeight: "700",
                            color: colors.mutedForeground,
                            textTransform: "uppercase",
                            letterSpacing: 0.6,
                            marginBottom: s(spacing.md),
                        }}
                        allowFontScaling={false}
                    >
                        Customer
                    </Text>
                    <PhoneRow
                        label="Name"
                        value={customerInfo.fullName}
                        s={s}
                        fs={fs}
                    />
                    <PhoneRow
                        label="Email"
                        value={customerInfo.email}
                        s={s}
                        fs={fs}
                    />
                    <PhoneRow
                        label="Contact"
                        value={customerInfo.contactNumber}
                        s={s}
                        fs={fs}
                    />
                    {customerInfo.preferredDate ? (
                        <PhoneRow
                            label="Date"
                            value={formatMonthDayYear(
                                customerInfo.preferredDate,
                            )}
                            s={s}
                            fs={fs}
                        />
                    ) : null}

                    <View
                        style={{
                            height: 1,
                            backgroundColor: colors.border,
                            marginVertical: s(spacing.lg),
                        }}
                    />

                    <Text
                        style={{
                            fontSize: fs(11),
                            fontWeight: "700",
                            color: colors.mutedForeground,
                            textTransform: "uppercase",
                            letterSpacing: 0.6,
                            marginBottom: s(spacing.md),
                        }}
                        allowFontScaling={false}
                    >
                        Booking
                    </Text>
                    <PhoneRow
                        label="Category"
                        value={category?.name}
                        s={s}
                        fs={fs}
                    />
                    <View
                        style={{
                            height: 1,
                            backgroundColor: colors.border,
                            marginVertical: s(spacing.md),
                        }}
                    />
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: s(spacing.sm),
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: fs(12),
                                    color: colors.mutedForeground,
                                }}
                                allowFontScaling={false}
                            >
                                Package
                            </Text>
                            <Text
                                style={{ fontSize: fs(15), fontWeight: "600" }}
                                allowFontScaling={false}
                            >
                                {selectedPackage.name}
                            </Text>
                            {inclusions.map((item, i) => (
                                <Text
                                    key={i}
                                    style={{
                                        fontSize: fs(12),
                                        color: colors.mutedForeground,
                                        marginLeft: s(spacing.sm),
                                    }}
                                    allowFontScaling={false}
                                >
                                    • {item}
                                </Text>
                            ))}
                        </View>
                        <Text
                            style={{
                                fontSize: fs(16),
                                fontWeight: "700",
                                color: colors.accent,
                            }}
                            allowFontScaling={false}
                        >
                            ₱{pkgPrice.toLocaleString()}
                        </Text>
                    </View>
                    {selectedAddons.length > 0 && (
                        <>
                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: colors.border,
                                    marginVertical: s(spacing.md),
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: fs(12),
                                    color: colors.mutedForeground,
                                    marginBottom: s(spacing.sm),
                                }}
                                allowFontScaling={false}
                            >
                                Add-ons
                            </Text>
                            {selectedAddons.map((addon) => (
                                <View
                                    key={addon.id}
                                    style={{
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        marginBottom: s(spacing.sm),
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: fs(14),
                                            fontWeight: "500",
                                            flex: 1,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        {addon.name}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: fs(14),
                                            fontWeight: "600",
                                            color: colors.accent,
                                        }}
                                        allowFontScaling={false}
                                    >
                                        +₱{Number(addon.price).toLocaleString()}
                                    </Text>
                                </View>
                                            ))}
                                        </>
                                    )}
                                    <View
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            backgroundColor: colors.accentLight,
                                            borderWidth: 2,
                                            borderColor: colors.primary,
                                            borderRadius: s(radii.xl),
                                            padding: s(spacing.xl),
                                            marginVertical: s(spacing.lg),
                                        }}
                                    >
                                        <Text
                                            style={{ fontSize: fs(15), fontWeight: "600" }}
                                            allowFontScaling={false}
                                        >
                                            Total Amount
                                        </Text>
                        <Text
                            style={{
                                fontSize: fs(28),
                                fontWeight: "700",
                                color: colors.primary,
                            }}
                            allowFontScaling={false}
                        >
                            ₱{grandTotal.toLocaleString()}
                        </Text>
                    </View>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: s(spacing.sm),
                            backgroundColor: colors.accentLight,
                            borderRadius: s(radii.lg),
                            padding: s(spacing.lg),
                            marginBottom: s(spacing.xl),
                        }}
                    >
                        <Icon
                            name="time-outline"
                            size={s(16)}
                            color={colors.primary}
                        />
                        <Text
                            style={{
                                fontSize: fs(13),
                                color: colors.mutedForeground,
                                flex: 1,
                                lineHeight: fs(19),
                            }}
                            allowFontScaling={false}
                        >
                            Your booking will be{" "}
                            <Text style={{ fontWeight: "700" }}>Pending</Text>{" "}
                            until confirmed by staff.
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: s(spacing.lg) }}>
                        <Button
                            label="Edit Selection"
                            icon="create-outline"
                            variant="secondary"
                            size="sm"
                            onPress={onEdit}
                            style={{ flex: 1 }}
                            disabled={loading}
                        />
                        <Button
                            label="Confirm Booking"
                            onPress={onConfirm}
                            size="sm"
                            loading={loading}
                            style={{ flex: 1 }}
                        />
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

function SRow({ label, value }) {
    return (
        <View style={{ flexDirection: "row", marginBottom: 7 }}>
            <Text
                style={{
                    fontSize: 11,
                    color: colors.mutedForeground,
                    width: 58,
                }}
                allowFontScaling={false}
            >
                {label}:
            </Text>
            <Text
                style={{ fontSize: 12, fontWeight: "600", flex: 1 }}
                allowFontScaling={false}
            >
                {value}
            </Text>
        </View>
    );
}
function PhoneRow({ label, value, s, fs }) {
    return (
        <View style={{ flexDirection: "row", marginBottom: s(spacing.sm) }}>
            <Text
                style={{
                    fontSize: fs(13),
                    color: colors.mutedForeground,
                    width: s(90),
                }}
                allowFontScaling={false}
            >
                {label}:
            </Text>
            <Text
                style={{ fontSize: fs(13), fontWeight: "600", flex: 1 }}
                allowFontScaling={false}
            >
                {value}
            </Text>
        </View>
    );
}
