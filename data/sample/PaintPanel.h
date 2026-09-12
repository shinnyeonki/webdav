#pragma once
#include "Panel.h"
#include "ActionListener.h"
#include "MouseListener.h"

#define FIG_RECT 0
#define FIG_ELL 1
#define FIG_LINE 2
#define FIG_GROUP 3
#define CHECK_GRID 4

class Figure;
class PaintFrame;
class PaintPanel : public Panel , public ActionListener , public MouseListener
{
public:
	PaintPanel();
	void actionPerformed(ActionEvent e) override;
	void mousePressed(MEvent) override;
	void mouseReleased(MEvent) override;
	void repaint(HDC) override;
	void setFrame(PaintFrame*);

	void setShape(int);
	void setCheck(int);
	void setGrouped();
	void setFigure();
	void setCheckBox();
	MPoint CheckGrid(MPoint p, int size);
	Figure* findFigure(MPoint p);
	void makeGroup();
	bool isFigureExist(Figure* f, MPoint start, MPoint end);

	PaintFrame* frame;
	MPoint start_;
	MPoint end_;



private:
	list<Figure*> fg;
	Figure* moveFigure_;
	MouseListener * listener_;
};

