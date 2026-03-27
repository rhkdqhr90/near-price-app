import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { TextStyle } from 'react-native';
import { parseHighlight } from '../../utils/highlight';
import { colors } from '../../theme/colors';

interface Props {
  text: string;
  baseStyle?: TextStyle;
  highlightColor?: string;
}

const HighlightText: React.FC<Props> = ({
  text,
  baseStyle,
  highlightColor = colors.primary,
}) => {
  const parts = parseHighlight(text ?? '');

  return (
    <Text style={baseStyle}>
      {parts.map((part, index) =>
        part.highlighted ? (
          <Text
            key={`h-${index}`}
            style={[styles.highlighted, { color: highlightColor }]}
          >
            {part.text}
          </Text>
        ) : (
          <Text key={`n-${index}`}>{part.text}</Text>
        ),
      )}
    </Text>
  );
};

const styles = StyleSheet.create({
  highlighted: {
    fontWeight: '700',
  },
});

export default HighlightText;
